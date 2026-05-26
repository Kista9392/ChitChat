package com.social.backend.repository;

import com.social.backend.entity.Comment;
import com.social.backend.entity.CommentLike;
import com.social.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    Optional<CommentLike> findByCommentAndUser(Comment comment, User user);

    void deleteByUser(User user);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM CommentLike cl WHERE cl.comment.author = :author")
    void deleteByCommentAuthor(@org.springframework.data.repository.query.Param("author") User author);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM CommentLike cl WHERE cl.comment.post = :post")
    void deleteByCommentPost(@org.springframework.data.repository.query.Param("post") com.social.backend.entity.Post post);
}
