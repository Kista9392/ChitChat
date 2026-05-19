package com.social.backend.dto;

import com.social.backend.entity.MediaType;

public class StoryRequest {
    private String mediaUrl;
    private MediaType mediaType;

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public MediaType getMediaType() { return mediaType; }
    public void setMediaType(MediaType mediaType) { this.mediaType = mediaType; }
}
