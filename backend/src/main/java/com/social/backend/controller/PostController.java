package com.social.backend.controller;

import com.social.backend.dto.PostResponse;
import com.social.backend.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @RequestPart("file") MultipartFile file,
            @RequestPart("content") String content,
            @RequestPart("mediaType") String mediaType,
            Authentication authentication
    ) {
        PostResponse response = postService.createPost(
                authentication.getName(), 
                content,
                file,
                mediaType
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostResponse> responsePage = postService.getFeed(pageable);
        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<java.util.List<PostResponse>> getUserPosts(@PathVariable String username) {
        return ResponseEntity.ok(postService.getUserPosts(username));
    }

    @GetMapping("/liked")
    public ResponseEntity<java.util.List<PostResponse>> getLikedPosts(Authentication authentication) {
        return ResponseEntity.ok(postService.getLikedPosts(authentication.getName()));
    }

    @GetMapping("/reels")
    public ResponseEntity<Page<PostResponse>> getReels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getReels(pageable));
    }

    @GetMapping("/explore")
    public ResponseEntity<Page<PostResponse>> getExplore(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getExplorePosts(authentication.getName(), pageable));
    }

    // Dynamic URL! The {postId} is passed directly from the browser URL into our Java method
    @PostMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable UUID postId, Authentication authentication) {
        String result = postService.toggleLike(authentication.getName(), postId);
        
        // Return exactly what happened so the frontend knows whether to fill in the heart icon or not!
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{postId}/view")
    public ResponseEntity<?> incrementView(@PathVariable UUID postId) {
        postService.incrementViewCount(postId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable UUID postId, Authentication authentication) {
        postService.deletePost(authentication.getName(), postId);
        return ResponseEntity.ok().body("Post deleted successfully");
    }
}
