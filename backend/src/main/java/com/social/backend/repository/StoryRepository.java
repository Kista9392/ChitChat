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

    /**
     * Returns all active stories authored by:
     *  - the requesting user themselves, OR
     *  - any user that the requesting user follows
     * Ordered newest-first.
     */
    @Query("""
            SELECT s FROM Story s
            JOIN FETCH s.user u
            WHERE u = :viewer
               OR u IN (
                   SELECT f.following FROM Follow f WHERE f.follower = :viewer
               )
            ORDER BY s.createdAt DESC
            """)
    List<Story> findStoriesForViewer(@Param("viewer") User viewer);

    @Modifying
    @Query("DELETE FROM Story s WHERE s.createdAt < :cutoff")
    void deleteExpiredStories(@Param("cutoff") LocalDateTime cutoff);
}
