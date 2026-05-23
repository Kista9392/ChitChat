package com.social.backend.repository;

import com.social.backend.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface StoryRepository extends JpaRepository<Story, UUID> {

    /**
     * Returns stories authored by:
     *  - the requesting user themselves, OR
     *  - any user that the requesting user follows
     * Uses UUID comparison (not entity equality) to avoid Hibernate 6 proxy issues.
     * Ordered newest-first.
     */
    @Query("""
            SELECT s FROM Story s
            JOIN FETCH s.user u
            WHERE u.id = :viewerId
               OR u.id IN (
                   SELECT f.following.id FROM Follow f WHERE f.follower.id = :viewerId
               )
            ORDER BY s.createdAt DESC
            """)
    List<Story> findStoriesForViewer(@Param("viewerId") UUID viewerId);

    @Modifying
    @Query("DELETE FROM Story s WHERE s.createdAt < :cutoff")
    void deleteExpiredStories(@Param("cutoff") LocalDateTime cutoff);
}
