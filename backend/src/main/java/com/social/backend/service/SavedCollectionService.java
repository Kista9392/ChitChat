package com.social.backend.service;

import com.social.backend.dto.PostResponse;
import com.social.backend.dto.SavedCollectionResponse;
import com.social.backend.entity.*;
import com.social.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SavedCollectionService {

    private final SavedCollectionRepository collectionRepository;
    private final SavedPostRepository savedPostRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public SavedCollectionService(
            SavedCollectionRepository collectionRepository,
            SavedPostRepository savedPostRepository,
            UserRepository userRepository,
            PostRepository postRepository
    ) {
        this.collectionRepository = collectionRepository;
        this.savedPostRepository = savedPostRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Get or create the default "All Posts" collection for a user
    @Transactional
    public SavedCollection getOrCreateDefault(User user) {
        return collectionRepository.findByUserAndName(user, "All Posts")
                .orElseGet(() -> collectionRepository.save(new SavedCollection("All Posts", user)));
    }

    @Transactional(readOnly = true)
    public List<SavedCollectionResponse> getCollections(String userEmail) {
        User user = getUser(userEmail);
        return collectionRepository.findByUserOrderByCreatedAtAsc(user).stream()
                .map(col -> {
                    List<SavedPost> posts = savedPostRepository.findByCollectionOrderBySavedAtDesc(col);
                    String cover = posts.isEmpty() ? null : posts.get(0).getPost().getMediaUrl();
                    return new SavedCollectionResponse(col.getId(), col.getName(), posts.size(), cover, col.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public SavedCollectionResponse createCollection(String userEmail, String name) {
        User user = getUser(userEmail);
        if (collectionRepository.findByUserAndName(user, name).isPresent()) {
            throw new RuntimeException("Collection with this name already exists");
        }
        SavedCollection col = collectionRepository.save(new SavedCollection(name, user));
        return new SavedCollectionResponse(col.getId(), col.getName(), 0, null, col.getCreatedAt());
    }

    @Transactional
    public void deleteCollection(String userEmail, UUID collectionId) {
        User user = getUser(userEmail);
        SavedCollection col = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        if (!col.getUser().getId().equals(user.getId())) throw new RuntimeException("Not authorized");
        if (col.getName().equals("All Posts")) throw new RuntimeException("Cannot delete default collection");
        collectionRepository.delete(col);
    }

    @Transactional
    public String toggleSavePost(String userEmail, UUID postId, UUID collectionId) {
        User user = getUser(userEmail);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        SavedCollection col;
        if (collectionId == null) {
            col = getOrCreateDefault(user);
        } else {
            col = collectionRepository.findById(collectionId)
                    .orElseThrow(() -> new RuntimeException("Collection not found"));
            if (!col.getUser().getId().equals(user.getId())) throw new RuntimeException("Not authorized");
        }

        return savedPostRepository.findByCollectionAndPost(col, post)
                .map(sp -> {
                    savedPostRepository.delete(sp);
                    return "removed";
                })
                .orElseGet(() -> {
                    savedPostRepository.save(new SavedPost(col, post));
                    return "saved";
                });
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPostsInCollection(String userEmail, UUID collectionId) {
        User user = getUser(userEmail);
        SavedCollection col = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        if (!col.getUser().getId().equals(user.getId())) throw new RuntimeException("Not authorized");

        return savedPostRepository.findByCollectionOrderBySavedAtDesc(col).stream()
                .map(sp -> {
                    Post p = sp.getPost();
                    return new PostResponse(
                            p.getId(), p.getContent(), p.getMediaUrl(),
                            p.getMediaType() != null ? p.getMediaType().name() : null,
                            p.getAuthor().getUsername(),
                            p.getAuthor().getAvatarUrl(),
                            p.getLikeCount(), p.getCommentCount(),
                            p.getViewCount(),
                            p.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
    }
}
