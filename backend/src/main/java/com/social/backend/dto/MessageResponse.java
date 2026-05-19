package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        String senderUsername,
        String receiverUsername,
        String content,
        LocalDateTime createdAt,
        LocalDateTime readAt,
        String mediaUrl,
        String messageType
) {}
