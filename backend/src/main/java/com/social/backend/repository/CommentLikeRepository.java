package com.social.backend.repository;

import com.social.backend.entity.Comment;
import com.social.backend.entity.CommentLike;
import com.social.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    Optional<CommentLike> findByCommentAndUser(Comment comment, User user);
}
