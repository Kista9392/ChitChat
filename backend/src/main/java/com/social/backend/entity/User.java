package com.social.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false, name = "password_hash")
    private String passwordHash;

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    private String bio;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "show_activity_status")
    private Boolean showActivityStatus = true;

    @Column(name = "push_notifications_enabled")
    private Boolean pushNotificationsEnabled = true;

    @Column(name = "email_notifications_enabled")
    private Boolean emailNotificationsEnabled = false;

    @Column(name = "is_private_account")
    private Boolean isPrivateAccount = false;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    @Formula("(select count(*) from follows f where f.following_id = {alias}.id)")
    private int followersCount;

    @Formula("(select count(*) from follows f where f.follower_id = {alias}.id)")
    private int followingCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Constructors ---
    public User() {
    }

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public User(String username, String email, String passwordHash, String phoneNumber) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phoneNumber = phoneNumber;
    }

    // --- Getters and Setters ---
    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public boolean isShowActivityStatus() {
        return showActivityStatus != null ? showActivityStatus : true;
    }

    public void setShowActivityStatus(Boolean showActivityStatus) {
        this.showActivityStatus = showActivityStatus;
    }

    public boolean isPushNotificationsEnabled() {
        return pushNotificationsEnabled != null ? pushNotificationsEnabled : true;
    }

    public void setPushNotificationsEnabled(Boolean pushNotificationsEnabled) {
        this.pushNotificationsEnabled = pushNotificationsEnabled;
    }

    public boolean isEmailNotificationsEnabled() {
        return emailNotificationsEnabled != null ? emailNotificationsEnabled : false;
    }

    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) {
        this.emailNotificationsEnabled = emailNotificationsEnabled;
    }

    public boolean isPrivateAccount() {
        return isPrivateAccount != null ? isPrivateAccount : false;
    }

    public void setPrivateAccount(Boolean privateAccount) {
        this.isPrivateAccount = privateAccount;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public int getFollowersCount() {
        return followersCount;
    }

    public int getFollowingCount() {
        return followingCount;
    }
}
