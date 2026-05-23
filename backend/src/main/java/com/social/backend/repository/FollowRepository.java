package com.social.backend.repository;

import com.social.backend.entity.Follow;
import com.social.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, UUID> {
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"following"})
    List<Follow> findByFollower(User follower);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"follower"})
    List<Follow> findByFollowing(User following);

    @Query("SELECT f2.following FROM Follow f1 JOIN Follow f2 ON f1.following = f2.follower WHERE f1.follower = :user AND f2.following != :user AND f2.following NOT IN (SELECT f3.following FROM Follow f3 WHERE f3.follower = :user)")
    List<User> findSuggestionsByMutualFollowers(@Param("user") User user);
    
    void deleteByFollower(User follower);
    void deleteByFollowing(User following);
    
    long countByFollower(User follower);
    long countByFollowing(User following);
}
