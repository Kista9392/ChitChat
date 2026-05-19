package com.social.backend.repository;

import com.social.backend.entity.Story;
import com.social.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface StoryRepository extends JpaRepository<Story, UUID> {
    
    @Query("SELECT s FROM Story s WHERE (s.user = :user OR s.user IN (SELECT f.following FROM Follow f WHERE f.follower = :user)) AND s.createdAt > :cutoff ORDER BY s.createdAt DESC")
    List<Story> findActiveStories(@Param("user") User user, @Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Query("DELETE FROM Story s WHERE s.createdAt < :cutoff")
    void deleteExpiredStories(@Param("cutoff") LocalDateTime cutoff);
}
