package com.social.backend.repository;

import com.social.backend.entity.Post;
import com.social.backend.entity.SavedCollection;
import com.social.backend.entity.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {
    List<SavedPost> findByCollectionOrderBySavedAtDesc(SavedCollection collection);
    Optional<SavedPost> findByCollectionAndPost(SavedCollection collection, Post post);
    void deleteByCollectionAndPost(SavedCollection collection, Post post);
}
