package com.social.backend.service;

import com.social.backend.dto.PostResponse;
import com.social.backend.dto.UserResponse;
import com.social.backend.entity.Post;
import com.social.backend.entity.User;
import com.social.backend.repository.PostRepository;
import com.social.backend.repository.UserRepository;
import com.social.backend.repository.FollowRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    public SearchService(UserRepository userRepository, PostRepository postRepository, FollowRepository followRepository, org.springframework.data.redis.core.StringRedisTemplate redisTemplate) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.followRepository = followRepository;
        this.redisTemplate = redisTemplate;
    }

    private boolean isUserOnline(String username) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey("online:" + username));
        } catch (Exception e) {
            return false;
        }
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query, String currentEmail) {
        if (query == null || query.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query);
        User currentUser = userRepository.findByEmail(currentEmail).orElse(null);
        
        return users.stream()
                .filter(user -> !user.getEmail().equals(currentEmail))
                .sorted((u1, u2) -> Integer.compare(u2.getFollowersCount(), u1.getFollowersCount()))
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getBio(),
                        user.getAvatarUrl(),
                        user.getFollowersCount(),
                        user.getFollowingCount(),
                        user.isShowActivityStatus(),
                        currentUser != null ? followRepository.findByFollowerAndFollowing(currentUser, user).isPresent() : false,
                        user.isPrivateAccount(),
                        isUserOnline(user.getUsername()),
                        user.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getMutualSuggestions(String currentEmail) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<User> suggestions = followRepository.findSuggestionsByMutualFollowers(user);
        return suggestions.stream()
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getBio(),
                        u.getAvatarUrl(),
                        u.getFollowersCount(),
                        u.getFollowingCount(),
                        u.isShowActivityStatus(),
                        false,
                        u.isPrivateAccount(),
                        isUserOnline(u.getUsername()),
                        u.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> searchPosts(String query, Pageable pageable) {
        Page<Post> posts = postRepository.findByContentContainingIgnoreCase(query, pageable);
        return mapPostPage(posts);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> searchByHashtag(String tagName, Pageable pageable) {
        // Remove # if the user included it in the search query
        String cleanTag = tagName.startsWith("#") ? tagName.substring(1) : tagName;
        Page<Post> posts = postRepository.findByHashtagName(cleanTag.toLowerCase(), pageable);
        return mapPostPage(posts);
    }

    private Page<PostResponse> mapPostPage(Page<Post> posts) {
        return posts.map(post -> new PostResponse(
                post.getId(),
                post.getContent(),
                post.getMediaUrl(),
                post.getMediaType().name(),
                post.getAuthor().getUsername(),
                post.getAuthor().getAvatarUrl(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getViewCount(),
                post.getCreatedAt()
        ));
    }
}
