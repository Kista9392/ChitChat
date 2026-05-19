package com.social.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID parentId,
        String content,
        String authorUsername,
        String authorAvatarUrl,
        int likeCount,
        boolean isLiked,
        LocalDateTime createdAt
) {}
