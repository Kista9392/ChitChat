package com.social.backend.controller;

import com.social.backend.dto.StoryResponse;
import com.social.backend.service.StoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<StoryResponse> createStory(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mediaType", defaultValue = "IMAGE") String mediaType,
            Authentication authentication
    ) {
        return ResponseEntity.ok(storyService.createStory(authentication.getName(), file, mediaType));
    }

    @PostMapping("/from-post/{postId}")
    public ResponseEntity<StoryResponse> createStoryFromPost(
            @PathVariable UUID postId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(storyService.createStoryFromPost(authentication.getName(), postId));
    }

    @GetMapping("/feed")
    public ResponseEntity<List<StoryResponse>> getStories(Authentication authentication) {
        return ResponseEntity.ok(storyService.getActiveStories(authentication.getName()));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<?> deleteStory(@PathVariable UUID storyId, Authentication authentication) {
        storyService.deleteStory(authentication.getName(), storyId);
        return ResponseEntity.ok().build();
    }
}
