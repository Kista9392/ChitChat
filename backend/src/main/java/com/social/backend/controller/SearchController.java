package com.social.backend.controller;

import com.social.backend.dto.PostResponse;
import com.social.backend.dto.UserResponse;
import com.social.backend.service.SearchService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam(value = "query", defaultValue = "") String query, org.springframework.security.core.Authentication authentication) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(searchService.searchUsers(query, currentEmail));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<UserResponse>> getSuggestions(org.springframework.security.core.Authentication authentication) {
        String currentEmail = authentication.getName();
        return ResponseEntity.ok(searchService.getMutualSuggestions(currentEmail));
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<PostResponse>> searchPosts(@RequestParam(value = "query", defaultValue = "") String query, Pageable pageable) {
        return ResponseEntity.ok(searchService.searchPosts(query, pageable));
    }

    @GetMapping("/hashtag/{tag}")
    public ResponseEntity<Page<PostResponse>> searchByHashtag(@PathVariable String tag, Pageable pageable) {
        return ResponseEntity.ok(searchService.searchByHashtag(tag, pageable));
    }
}
