package com.social.backend.dto;

public record AuthResponse(
    String accessToken, 
    String refreshToken, 
    String username,
    String avatarUrl
) {}
