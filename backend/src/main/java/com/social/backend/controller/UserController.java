package com.social.backend.controller;

import com.social.backend.dto.UserResponse;
import com.social.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable String username, org.springframework.security.core.Authentication authentication) {
        String currentEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(userService.getUserProfile(username, currentEmail));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<?> toggleFollow(@PathVariable String username, Authentication authentication) {
        String result = userService.toggleFollow(authentication.getName(), username);
        return ResponseEntity.ok(result);
    }

    // Update bio
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        UserResponse updated = userService.updateBio(authentication.getName(), body.get("bio"));
        return ResponseEntity.ok(updated);
    }

    // Update settings
    @PutMapping("/me/settings")
    public ResponseEntity<Void> updateSettings(
            @RequestBody Map<String, Boolean> body,
            Authentication authentication
    ) {
        userService.updateSettings(authentication.getName(), body.get("pushNotifications"), body.get("emailNotifications"), body.get("isPrivateAccount"));
        return ResponseEntity.ok().build();
    }

    // Get settings
    @GetMapping("/me/settings")
    public ResponseEntity<Map<String, Boolean>> getSettings(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(userService.getSettings(authentication.getName()));
    }


    // Upload avatar
    @PostMapping("/me/avatar")
    public ResponseEntity<UserResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        UserResponse updated = userService.updateAvatar(authentication.getName(), file);
        return ResponseEntity.ok(updated);
    }

    // Change password
    @PutMapping("/me/password")
    public ResponseEntity<String> changePassword(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        userService.changePassword(authentication.getName(), body.get("oldPassword"), body.get("newPassword"));
        return ResponseEntity.ok("Password updated successfully");
    }

    // Delete account
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(Authentication authentication) {
        userService.deleteAccount(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    // Update activity status
    @PutMapping("/me/activity-status")
    public ResponseEntity<Void> updateActivityStatus(
            @RequestBody Map<String, Boolean> body,
            Authentication authentication
    ) {
        userService.updateActivityStatus(authentication.getName(), body.get("status"));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/ping")
    public ResponseEntity<Void> pingOnline(Authentication authentication) {
        userService.pingUserOnline(authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/suggestions")
    public ResponseEntity<java.util.List<com.social.backend.dto.RecommendationResponse>> getSuggestions(Authentication authentication) {
        return ResponseEntity.ok(userService.getSuggestions(authentication.getName()));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<java.util.List<UserResponse>> getFollowers(@PathVariable String username, org.springframework.security.core.Authentication authentication) {
        String targetUsername = "me".equals(username) && authentication != null ? userService.getUsernameByEmail(authentication.getName()) : username;
        return ResponseEntity.ok(userService.getFollowers(targetUsername, authentication.getName()));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<java.util.List<UserResponse>> getFollowing(@PathVariable String username, org.springframework.security.core.Authentication authentication) {
        String targetUsername = "me".equals(username) && authentication != null ? userService.getUsernameByEmail(authentication.getName()) : username;
        return ResponseEntity.ok(userService.getFollowing(targetUsername, authentication.getName()));
    }
}
