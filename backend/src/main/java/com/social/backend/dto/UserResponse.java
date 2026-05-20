package com.social.backend.dto;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String bio,
        String avatarUrl,
        int followersCount,
        int followingCount,
        boolean showActivityStatus,
        boolean isFollowing,
        boolean isPrivateAccount,
        boolean isOnline
) {}
