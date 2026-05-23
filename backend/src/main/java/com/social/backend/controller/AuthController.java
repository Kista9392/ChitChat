package com.social.backend.controller;

import com.social.backend.dto.*;
import com.social.backend.entity.User;
import com.social.backend.service.EmailService;
import com.social.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserService  userService;
    private final EmailService emailService;

    @Autowired
    private com.social.backend.repository.FollowRepository followRepository;

    @Autowired
    private com.social.backend.repository.UserRepository userRepository;

    @Autowired(required = false)
    private org.springframework.security.oauth2.client.registration.ClientRegistrationRepository clientRegistrationRepository;

    @Value("${GOOGLE_CLIENT_ID:NOT_SET}")
    private String googleClientId;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String resolvedFrontendUrl;

    @Value("${app.api-url:http://localhost:7860}")
    private String resolvedApiUrl;

    public AuthController(UserService userService, EmailService emailService) {
        this.userService  = userService;
        this.emailService = emailService;
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

    // Temporary debug endpoint - shows first 10 chars of Google Client ID and bean status
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
            "rawEnvLength", String.valueOf(rawEnv == null ? 0 : rawEnv.length()),
            "clientRegistrationRepositoryPresent", String.valueOf(clientRegistrationRepository != null),
            "resolvedFrontendUrl", resolvedFrontendUrl,
            "resolvedApiUrl", resolvedApiUrl,
            "envFrontendUrl", String.valueOf(System.getenv("FRONTEND_URL")),
            "envAppApiUrl", String.valueOf(System.getenv("APP_API_URL"))
        ));
    }

    /**
     * Test endpoint — open this URL in a browser to diagnose email issues.
     * Shows the exact Brevo API response (success or error).
     *
     * Usage: GET /api/v1/auth/debug/test-email?to=youremail@gmail.com
     */
    @GetMapping("/debug/test-email")
    public ResponseEntity<Map<String, String>> testEmail(
            @RequestParam(defaultValue = "kistareddypullagurla123@gmail.com") String to) {
        String result = emailService.testEmail(to);
        return ResponseEntity.ok(Map.of(
            "to",     to,
            "result", result,
            "sender", EmailService.DEVELOPER_EMAIL
        ));
    }

    @GetMapping("/debug/follows")
    public ResponseEntity<?> getDebugFollows() {
        return ResponseEntity.ok(followRepository.findAll().stream()
            .map(f -> Map.of(
                "id", f.getId(),
                "follower", f.getFollower().getUsername(),
                "following", f.getFollowing().getUsername(),
                "createdAt", f.getCreatedAt()
            ))
            .toList());
    }

    @GetMapping("/debug/fix-usernames")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> fixUsernames() {
        java.util.List<User> users = userRepository.findAll();
        int fixedCount = 0;
        for (User u : users) {
            String trimmed = u.getUsername() != null ? u.getUsername().trim() : null;
            if (trimmed != null && !trimmed.equals(u.getUsername())) {
                u.setUsername(trimmed);
                userRepository.save(u);
                fixedCount++;
            }
        }
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Successfully fixed trailing/leading spaces in usernames",
            "fixedCount", fixedCount
        ));
    }
}
