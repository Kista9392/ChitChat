package com.social.backend.controller;

import com.social.backend.entity.Suggestion;
import com.social.backend.entity.User;
import com.social.backend.entity.Role;
import com.social.backend.entity.NotificationType;
import com.social.backend.repository.SuggestionRepository;
import com.social.backend.repository.UserRepository;
import com.social.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/suggestions")
public class SuggestionController {

    private final SuggestionRepository suggestionRepository;
    private final UserRepository userRepository;
    private final com.social.backend.service.NotificationService notificationService;
    private final EmailService emailService;

    public SuggestionController(SuggestionRepository suggestionRepository, UserRepository userRepository, com.social.backend.service.NotificationService notificationService, EmailService emailService) {
        this.suggestionRepository = suggestionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<?> createSuggestion(@RequestBody Map<String, String> request, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String content = request.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Content cannot be empty");
        }

        Suggestion suggestion = new Suggestion(user, content);
        suggestionRepository.save(suggestion);

        // Send email securely to the developer (kistareddypullagurla123@gmail.com)
        emailService.sendDeveloperEmail(EmailService.DEVELOPER_EMAIL, user.getUsername(), "New Suggestion from @" + user.getUsername(), content);

        // Find admin!
        java.util.List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (!admins.isEmpty()) {
            User admin = admins.get(0);
            notificationService.sendNotification(
                    admin.getId(),
                    user.getId(),
                    NotificationType.SYSTEM,
                    "New Suggestion from " + user.getUsername() + ": " + content
            );
        } else {
            // Fallback: Send to the user themselves so they can see it works!
            notificationService.sendNotification(
                    user.getId(),
                    user.getId(),
                    NotificationType.SYSTEM,
                    "Suggestion received: " + content
            );
        }

        return ResponseEntity.ok("Suggestion submitted successfully!");
    }

    @PostMapping("/bug")
    public ResponseEntity<?> reportBug(@RequestBody Map<String, String> request, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String content = request.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Content cannot be empty");
        }

        // Send secure bug report email to the developer (kistareddypullagurla123@gmail.com)
        emailService.sendDeveloperEmail(EmailService.DEVELOPER_EMAIL, user.getUsername(), "New Bug Report from @" + user.getUsername(), content);

        // Notify user via system notification that report was securely received
        notificationService.sendNotification(
                user.getId(),
                user.getId(),
                NotificationType.SYSTEM,
                "Bug report securely sent to developer: " + (content.length() > 50 ? content.substring(0, 50) + "..." : content)
        );

        return ResponseEntity.ok("Bug report submitted successfully!");
    }
}

