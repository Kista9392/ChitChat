package com.social.backend.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "hashtags")
public class Hashtag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    @ManyToMany(mappedBy = "hashtags")
    private Set<Post> posts = new HashSet<>();

    public Hashtag() {}

    public Hashtag(String name) {
        this.name = name.toLowerCase();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public Set<Post> getPosts() { return posts; }
}
