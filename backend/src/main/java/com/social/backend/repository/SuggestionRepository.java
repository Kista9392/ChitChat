package com.social.backend.repository;

import com.social.backend.entity.Suggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SuggestionRepository extends JpaRepository<Suggestion, UUID> {
}
