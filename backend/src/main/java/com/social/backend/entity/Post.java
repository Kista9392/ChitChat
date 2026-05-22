package com.social.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "media_url")
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type")
    private MediaType mediaType;

    // 🏆 SENIOR ENGINEER TRICK: @Formula
    // Instead of doing complex math in Java, we tell Hibernate to dynamically run this exact 
    // SQL subquery inside the database every single time it fetches a Post. This is insanely fast!
    @Formula("(select count(*) from post_likes pl where pl.post_id = {alias}.id)")
    private int likeCount;

    @Formula("(select count(*) from comments c where c.post_id = {alias}.id)")
    private int commentCount;

    @Column(name = "view_count", nullable = false, columnDefinition = "integer default 0")
    private int viewCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "post_hashtags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "hashtag_id")
    )
    private java.util.Set<Hashtag> hashtags = new java.util.HashSet<>();

    public Post() {}

    public Post(User author, String content, String mediaUrl, MediaType mediaType) {
        this.author = author;
        this.content = content;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType != null ? mediaType : MediaType.TEXT_ONLY;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public MediaType getMediaType() { return mediaType; }
    public void setMediaType(MediaType mediaType) { this.mediaType = mediaType; }

    public int getLikeCount() { return likeCount; } // New Getter!
    public int getCommentCount() { return commentCount; }

    public int getViewCount() { return viewCount; }
    public void setViewCount(int viewCount) { this.viewCount = viewCount; }

    public java.util.Set<Hashtag> getHashtags() { return hashtags; }
    public void setHashtags(java.util.Set<Hashtag> hashtags) { this.hashtags = hashtags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
