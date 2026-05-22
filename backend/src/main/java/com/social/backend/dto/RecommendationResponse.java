package com.social.backend.dto;

import java.util.UUID;

public record RecommendationResponse(
        UUID id,
        String username,
        String avatarUrl,
        String reason,
        boolean isFollowing
) {}
