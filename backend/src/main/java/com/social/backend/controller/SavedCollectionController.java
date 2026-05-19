package com.social.backend.controller;

import com.social.backend.dto.PostResponse;
import com.social.backend.dto.SavedCollectionResponse;
import com.social.backend.service.SavedCollectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections")
public class SavedCollectionController {

    private final SavedCollectionService service;

    public SavedCollectionController(SavedCollectionService service) {
        this.service = service;
    }

    // GET /collections → all my collections
    @GetMapping
    public ResponseEntity<List<SavedCollectionResponse>> getCollections(Authentication auth) {
        return ResponseEntity.ok(service.getCollections(auth.getName()));
    }

    // POST /collections → create new collection
    @PostMapping
    public ResponseEntity<SavedCollectionResponse> createCollection(
            @RequestBody Map<String, String> body,
            Authentication auth
    ) {
        return ResponseEntity.ok(service.createCollection(auth.getName(), body.get("name")));
    }

    // DELETE /collections/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable UUID id, Authentication auth) {
        service.deleteCollection(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // GET /collections/{id}/posts → posts inside a collection
    @GetMapping("/{id}/posts")
    public ResponseEntity<List<PostResponse>> getPostsInCollection(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(service.getPostsInCollection(auth.getName(), id));
    }

    // POST /collections/save/{postId}?collectionId=... → save/unsave post
    @PostMapping("/save/{postId}")
    public ResponseEntity<String> toggleSave(
            @PathVariable UUID postId,
            @RequestParam(required = false) UUID collectionId,
            Authentication auth
    ) {
        String result = service.toggleSavePost(auth.getName(), postId, collectionId);
        return ResponseEntity.ok(result);
    }
}
