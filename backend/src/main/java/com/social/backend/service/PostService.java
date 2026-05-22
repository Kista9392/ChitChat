package com.social.backend.service;

import com.social.backend.dto.PostResponse;
import com.social.backend.entity.NotificationType;
import com.social.backend.entity.Post;
import com.social.backend.entity.PostLike;
import com.social.backend.entity.User;
import com.social.backend.repository.HashtagRepository;
import com.social.backend.repository.PostLikeRepository;
import com.social.backend.repository.PostRepository;
import com.social.backend.repository.UserRepository;
import com.social.backend.repository.CommentRepository;
import com.social.backend.repository.CommentLikeRepository;
import com.social.backend.repository.SavedPostRepository;
import com.social.backend.entity.Hashtag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;
import com.social.backend.entity.MediaType;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final NotificationService notificationService;
    private final HashtagRepository hashtagRepository;
    private final FileStorageService fileStorageService;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final SavedPostRepository savedPostRepository;

    @org.springframework.beans.factory.annotation.Value("${app.api-url:http://localhost:8080}")
    private String apiUrl;

    public PostService(PostRepository postRepository, UserRepository userRepository, PostLikeRepository postLikeRepository, NotificationService notificationService, HashtagRepository hashtagRepository, FileStorageService fileStorageService, CommentRepository commentRepository, CommentLikeRepository commentLikeRepository, SavedPostRepository savedPostRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postLikeRepository = postLikeRepository;
        this.notificationService = notificationService;
        this.hashtagRepository = hashtagRepository;
        this.fileStorageService = fileStorageService;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.savedPostRepository = savedPostRepository;
    }

    @Transactional
    public PostResponse createPost(String userEmail, String content, MultipartFile file, String mediaTypeStr) {
        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String filename = fileStorageService.save(file);
        String mediaUrl = filename.startsWith("http") ? filename : (apiUrl + "/uploads/" + filename);
        MediaType mediaType = MediaType.valueOf(mediaTypeStr.toUpperCase());

        Post newPost = new Post(author, content, mediaUrl, mediaType);
        
        extractAndSetHashtags(newPost);
        extractAndNotifyMentions(newPost, author);
        
        Post savedPost = postRepository.saveAndFlush(newPost);

        return mapToResponse(savedPost);
    }

    private PostResponse mapToResponse(Post post) {
        return new PostResponse(
                post.getId(),
                post.getContent(),
                post.getMediaUrl(),
                post.getMediaType() != null ? post.getMediaType().name() : "IMAGE",
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getViewCount(),
                post.getCreatedAt()
        );
    }

    private void extractAndSetHashtags(Post post) {
        String content = post.getContent();
        if (content == null) return;

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("#(\\w+)");
        java.util.regex.Matcher matcher = pattern.matcher(content);

        java.util.Set<Hashtag> hashtags = new java.util.HashSet<>();
        while (matcher.find()) {
            String tagName = matcher.group(1).toLowerCase();
            Hashtag hashtag = hashtagRepository.findByName(tagName)
                    .orElseGet(() -> hashtagRepository.save(new Hashtag(tagName)));
            hashtags.add(hashtag);
        }
        post.setHashtags(hashtags);
    }

    private void extractAndNotifyMentions(Post post, User author) {
        String content = post.getContent();
        if (content == null) return;

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("@(\\w+)");
        java.util.regex.Matcher matcher = pattern.matcher(content);

        while (matcher.find()) {
            String username = matcher.group(1);
            userRepository.findByUsername(username).ifPresent(mentionedUser -> {
                notificationService.sendNotification(
                        mentionedUser.getId(),
                        author.getId(),
                        NotificationType.MENTION,
                        author.getUsername() + " mentioned you in a post"
                );
            });
        }
    }

    // @Transactional ensures that the database connection stays completely open while we map the data
    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Page<Post> postsPage = postRepository.findFeedPosts(user, pageable);
        return postsPage.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findByAuthorOrderByCreatedAtDesc(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getLikedPosts(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postLikeRepository.findByUser(user).stream()
                .map(PostLike::getPost)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // @Transactional ensures that if any part of the liking process fails, the entire thing rolls back cleanly
    @Transactional
    public String toggleLike(String userEmail, UUID postId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Did they already like this post?
        Optional<PostLike> existingLike = postLikeRepository.findByUserAndPost(user, post);

        if (existingLike.isPresent()) {
            // UNLIKE: If it already exists, clicking the button again deletes the like!
            postLikeRepository.delete(existingLike.get());
            return "Post unliked successfully!";
        } else {
            // LIKE: If it doesn't exist, we create it.
            PostLike newLike = new PostLike(user, post);
            postLikeRepository.save(newLike);
            notificationService.sendNotification(post.getAuthor().getId(), user.getId(), NotificationType.LIKE, user.getUsername() + " liked your post");
            return "Post liked successfully!";
        }
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getReels(Pageable pageable) {
        return postRepository.findByMediaTypeOrderByCreatedAtDesc(com.social.backend.entity.MediaType.VIDEO, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getExplorePosts(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return postRepository.findExplorePosts(user, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public void incrementViewCount(UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);
    }

    @Transactional
    public void deletePost(String userEmail, UUID postId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this post");
        }

        // 1. Delete Saved Post bookmarks
        savedPostRepository.deleteByPost(post);

        // 2. Delete Comment Likes
        commentLikeRepository.deleteByCommentPost(post);

        // 3. Delete Comments
        commentRepository.deleteByPost(post);

        // 4. Delete Post Likes
        postLikeRepository.deleteByPost(post);

        // 5. Delete Post itself
        postRepository.delete(post);
    }
}
