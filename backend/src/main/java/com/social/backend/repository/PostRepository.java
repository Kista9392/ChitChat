package com.social.backend.repository;

import com.social.backend.entity.Post;
import com.social.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    
    // Spring Data JPA magic: By naming the method this way, 
    // it automatically writes the SQL: SELECT * FROM posts ORDER BY created_at DESC
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Follow-based feed: show own posts + posts from users the current user follows + mutual connections' posts
    @Query("SELECT p FROM Post p WHERE p.author = :user " +
           "OR p.author IN (SELECT f.following FROM Follow f WHERE f.follower = :user) " +
           "OR p.author IN (SELECT f2.following FROM Follow f2 WHERE f2.follower IN (SELECT f1.following FROM Follow f1 WHERE f1.follower = :user)) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findFeedPosts(@Param("user") User user, Pageable pageable);

    Page<Post> findByContentContainingIgnoreCase(String content, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Post p JOIN p.hashtags h WHERE h.name = :tagName")
    Page<Post> findByHashtagName(String tagName, Pageable pageable);

    java.util.List<Post> findByAuthorOrderByCreatedAtDesc(com.social.backend.entity.User author);

    Page<Post> findByMediaTypeOrderByCreatedAtDesc(com.social.backend.entity.MediaType mediaType, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Post p WHERE p.author != :user AND NOT EXISTS (SELECT f FROM Follow f WHERE f.follower = :user AND f.following = p.author) ORDER BY p.createdAt DESC")
    Page<Post> findExplorePosts(com.social.backend.entity.User user, Pageable pageable);
}
