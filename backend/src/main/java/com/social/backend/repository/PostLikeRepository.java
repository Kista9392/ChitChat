package com.social.backend.repository;

import com.social.backend.entity.Post;
import com.social.backend.entity.PostLike;
import com.social.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {
    
    // We need to check if a user has already liked a post so we can "Unlike" it if they click again!
    Optional<PostLike> findByUserAndPost(User user, Post post);
    
    List<PostLike> findByUser(User user);
    
    void deleteByUser(User user);
    void deleteByPost(Post post);
}
