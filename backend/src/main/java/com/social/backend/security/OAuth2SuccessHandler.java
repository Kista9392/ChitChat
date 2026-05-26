package com.social.backend.security;

import com.social.backend.entity.User;
import com.social.backend.repository.UserRepository;
import com.social.backend.service.EmailService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtService jwtService, EmailService emailService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        // Sanitize frontendUrl to remove any CR/LF characters and ensure https:// prefix
        String cleanFrontendUrl = frontendUrl.replaceAll("[\\r\\n]", "").trim();
        if (!cleanFrontendUrl.startsWith("http://") && !cleanFrontendUrl.startsWith("https://")) {
            cleanFrontendUrl = "https://" + cleanFrontendUrl;
        }

        // 1. Check if user exists. If not, register them automatically!
        java.util.Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isEmpty()) {
            String name = oAuth2User.getAttribute("name");
            String givenName = oAuth2User.getAttribute("given_name");
            String picture = oAuth2User.getAttribute("picture");
            
            // Generate a clean, unique username
            String baseUsername = (givenName != null && !givenName.isBlank()) ? givenName.toLowerCase() : 
                                  ((name != null && !name.isBlank()) ? name.replaceAll("\\s+", "").toLowerCase() : 
                                  email.split("@")[0].toLowerCase());
            
            baseUsername = baseUsername.replaceAll("[^a-zA-Z0-9]", "");
            if (baseUsername.length() > 30) {
                baseUsername = baseUsername.substring(0, 30);
            } else if (baseUsername.isEmpty()) {
                baseUsername = "user";
            }
            
            String username = baseUsername;
            int counter = 1;
            while (userRepository.findByUsername(username).isPresent()) {
                username = baseUsername + counter++;
            }
            
            user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(java.util.UUID.randomUUID().toString()));
            user.setAvatarUrl(picture);
            
            user = userRepository.save(user);
        } else {
            user = userOpt.get();
        }
        
        // 2. Generate our custom JWT tokens
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Send login notification email
        try {
            emailService.sendLoginNotificationEmail(user.getEmail(), user.getUsername());
        } catch (Exception e) {
            System.err.println("Failed to send login notification email: " + e.getMessage());
        }

        // 3. Redirect back to the Frontend with the tokens and username
        String redirectUrl = cleanFrontendUrl + "/oauth2/redirect?accessToken=" + accessToken
                + "&refreshToken=" + refreshToken
                + "&username=" + user.getUsername();
        
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
