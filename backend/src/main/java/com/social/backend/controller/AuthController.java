package com.social.backend.controller;

import com.social.backend.dto.*;
import com.social.backend.entity.User;
import com.social.backend.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService userService;

    @Value("${GOOGLE_CLIENT_ID:NOT_SET}")
    private String googleClientId;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        User newUser = userService.registerUser(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getPhoneNumber()
        );
        return ResponseEntity.ok(newUser);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginUser(@RequestBody LoginRequest request) {
        AuthResponse response = userService.loginUser(request.identifier(), request.password());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        AuthResponse response = userService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        UserResponse user = userService.getUserProfileByEmail(authentication.getName());
        return ResponseEntity.ok(user);
    }

    // Redirect /login to frontend (Spring OAuth2 default redirect)
    @GetMapping("/login-redirect")
    public void loginRedirect(jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isBlank()) frontendUrl = "http://localhost:3000";
        response.sendRedirect(frontendUrl + "/login");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String result = userService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        String result = userService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(result);
    }

    // Temporary debug endpoint - shows first 10 chars of Google Client ID
    @GetMapping("/debug/oauth")
    public ResponseEntity<Map<String, String>> debugOauth() {
        String preview = googleClientId == null ? "null" :
                googleClientId.length() > 10 ? googleClientId.substring(0, 10) + "..." : googleClientId;
        // Also check raw env var
        String rawEnv = System.getenv("GOOGLE_CLIENT_ID");
        String rawPreview = rawEnv == null ? "null" : rawEnv.length() > 10 ? rawEnv.substring(0, 10) + "..." : rawEnv;
        return ResponseEntity.ok(Map.of(
            "googleClientIdPreview", preview,
            "length", String.valueOf(googleClientId == null ? 0 : googleClientId.length()),
            "rawEnvPreview", rawPreview,
            "rawEnvLength", String.valueOf(rawEnv == null ? 0 : rawEnv.length())
        ));
    }
}
