package com.social.backend.repository;

import com.social.backend.entity.Comment;
import com.social.backend.entity.User;
import com.social.backend.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    // Automatically generates SQL to get paginated comments for a specific post!
    Page<Comment> findAllByPostIdOrderByCreatedAtDesc(UUID postId, Pageable pageable);
    
    void deleteByAuthor(User author);
    void deleteByPost(Post post);
}
