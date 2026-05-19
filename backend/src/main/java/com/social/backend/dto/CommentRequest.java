package com.social.backend.dto;

import java.util.UUID;

public record CommentRequest(String content, UUID parentId) {}
