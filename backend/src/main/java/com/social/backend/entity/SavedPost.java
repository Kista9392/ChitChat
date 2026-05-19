package com.social.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_posts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"collection_id", "post_id"})
})
public class SavedPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collection_id", nullable = false)
    private SavedCollection collection;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @CreationTimestamp
    @Column(name = "saved_at", updatable = false)
    private LocalDateTime savedAt;

    public SavedPost() {}

    public SavedPost(SavedCollection collection, Post post) {
        this.collection = collection;
        this.post = post;
    }

    public UUID getId() { return id; }
    public SavedCollection getCollection() { return collection; }
    public Post getPost() { return post; }
    public LocalDateTime getSavedAt() { return savedAt; }
}
