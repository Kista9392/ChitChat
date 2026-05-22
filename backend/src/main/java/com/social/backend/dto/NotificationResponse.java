package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String senderUsername,
        String type,
        String content,
        boolean read,
        LocalDateTime createdAt
) {}
