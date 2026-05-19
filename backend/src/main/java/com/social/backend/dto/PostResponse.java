package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record PostResponse(
        UUID id,
        String content,
        String mediaUrl,
        String mediaType, // Tells Next.js whether to render an <img> or <video> tag!
        String authorUsername,
        String authorAvatarUrl,
        int likeCount,
        int commentCount,
        int viewCount,
        LocalDateTime createdAt
) {}
