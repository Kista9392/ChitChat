package com.social.backend.dto;

import com.social.backend.entity.MediaType;

public record PostRequest(
    String content, 
    String mediaUrl, 
    MediaType mediaType
) {}
