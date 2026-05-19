package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String actorUsername,
        String type,
        String message,
        boolean isRead,
        LocalDateTime createdAt
) {}
