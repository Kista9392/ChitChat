package com.social.backend.security;

import com.social.backend.entity.User;
import com.social.backend.repository.UserRepository;
import com.social.backend.service.EmailService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    public OAuth2SuccessHandler(UserRepository userRepository, JwtService jwtService, EmailService emailService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");

        // 1. Check if user exists. If not, do NOT register them automatically!
        java.util.Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Redirect back to frontend with error and pre-filled email
            String errorUrl = "http://localhost:3000/oauth2/redirect?error=not_registered&email=" + email;
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
            return;
        }
        
        User user = userOpt.get();
        
        // 2. Generate our custom JWT tokens
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Send login notification email
        try {
            emailService.sendLoginNotificationEmail(user.getEmail(), user.getUsername());
        } catch (Exception e) {
            System.err.println("Failed to send login notification email: " + e.getMessage());
        }

        // 3. Redirect back to the Frontend (Next.js) with the tokens and username
        String frontendUrl = "http://localhost:3000/oauth2/redirect?accessToken=" + accessToken + "&refreshToken=" + refreshToken + "&username=" + user.getUsername();
        
        getRedirectStrategy().sendRedirect(request, response, frontendUrl);
    }
}
