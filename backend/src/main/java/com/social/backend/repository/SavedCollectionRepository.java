package com.social.backend.repository;

import com.social.backend.entity.SavedCollection;
import com.social.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedCollectionRepository extends JpaRepository<SavedCollection, UUID> {
    List<SavedCollection> findByUserOrderByCreatedAtAsc(User user);
    Optional<SavedCollection> findByUserAndName(User user, String name);
    void deleteByUser(User user);
}
