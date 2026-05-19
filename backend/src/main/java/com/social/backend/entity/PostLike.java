package com.social.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
// The UniqueConstraint is the most important part of this entire file!
// It tells the database: "If this exact user tries to like this exact post a second time, CRASH immediately."
@Table(name = "post_likes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "post_id"})
})
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public PostLike() {}

    public PostLike(User user, Post post) {
        this.user = user;
        this.post = post;
    }

    public UUID getId() { return id; }
    public User getUser() { return user; }
    public Post getPost() { return post; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
