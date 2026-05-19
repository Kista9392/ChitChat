package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SavedCollectionResponse(
    UUID id,
    String name,
    int postCount,
    String coverImageUrl,
    LocalDateTime createdAt
) {}
