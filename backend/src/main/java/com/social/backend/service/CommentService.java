package com.social.backend.service;

import com.social.backend.dto.CommentResponse;
import com.social.backend.entity.Comment;
import com.social.backend.entity.CommentLike;
import com.social.backend.entity.NotificationType;
import com.social.backend.entity.Post;
import com.social.backend.entity.User;
import com.social.backend.repository.CommentLikeRepository;
import com.social.backend.repository.CommentRepository;
import com.social.backend.repository.PostRepository;
import com.social.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CommentLikeRepository commentLikeRepository;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository, NotificationService notificationService, CommentLikeRepository commentLikeRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.commentLikeRepository = commentLikeRepository;
    }

    @Transactional
    public CommentResponse addComment(String userEmail, UUID postId, String content, UUID parentId) {
        User author = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment(content, author, post);
        
        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
            comment.setParent(parent);
            notificationService.sendNotification(parent.getAuthor().getId(), author.getId(), NotificationType.COMMENT, author.getUsername() + " replied to your comment");
        } else {
            notificationService.sendNotification(post.getAuthor().getId(), author.getId(), NotificationType.COMMENT, author.getUsername() + " commented on your post");
        }

        Comment savedComment = commentRepository.save(comment);

        return mapToResponse(savedComment, author);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsForPost(UUID postId, Pageable pageable, String currentUserEmail) {
        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found");
        }

        User currentUser = null;
        if (currentUserEmail != null) {
            currentUser = userRepository.findByEmail(currentUserEmail).orElse(null);
        }

        Page<Comment> commentsPage = commentRepository.findAllByPostIdOrderByCreatedAtDesc(postId, pageable);

        User finalCurrentUser = currentUser;
        return commentsPage.map(comment -> mapToResponse(comment, finalCurrentUser));
    }

    @Transactional
    public String toggleLike(String email, UUID commentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        java.util.Optional<CommentLike> existing = commentLikeRepository.findByCommentAndUser(comment, user);
        if (existing.isPresent()) {
            commentLikeRepository.delete(existing.get());
            return "Comment unliked";
        } else {
            commentLikeRepository.save(new CommentLike(comment, user));
            notificationService.sendNotification(comment.getAuthor().getId(), user.getId(), NotificationType.LIKE, user.getUsername() + " liked your comment");
            return "Comment liked";
        }
    }

    private CommentResponse mapToResponse(Comment comment, User currentUser) {
        boolean isLiked = false;
        if (currentUser != null) {
            isLiked = commentLikeRepository.findByCommentAndUser(comment, currentUser).isPresent();
        }
        return new CommentResponse(
                comment.getId(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                comment.getContent(),
                comment.getAuthor().getUsername(),
                comment.getAuthor().getAvatarUrl(),
                comment.getLikeCount(),
                isLiked,
                comment.getCreatedAt()
        );
    }
}
