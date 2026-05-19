package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record StoryResponse(
        UUID id,
        String mediaUrl,
        String mediaType,
        String authorUsername,
        String authorAvatarUrl,
        LocalDateTime createdAt
) {}
