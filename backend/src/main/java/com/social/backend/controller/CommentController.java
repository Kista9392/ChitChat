package com.social.backend.controller;

import com.social.backend.dto.CommentRequest;
import com.social.backend.dto.CommentResponse;
import com.social.backend.service.CommentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/posts/{postId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID postId,
            @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        CommentResponse response = commentService.addComment(
                authentication.getName(),
                postId,
                request.content(),
                request.parentId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication
    ) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<CommentResponse> responsePage = commentService.getCommentsForPost(postId, pageable, authentication != null ? authentication.getName() : null);
        return ResponseEntity.ok(responsePage);
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable UUID commentId, Authentication authentication) {
        String result = commentService.toggleLike(authentication.getName(), commentId);
        return ResponseEntity.ok(result);
    }
}
