package com.social.backend.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * Handles Spring Security's default /login redirect.
 * When OAuth2 flow fails or needs to show login, redirect to frontend.
 */
@RestController
public class LoginController {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @GetMapping("/login")
    public void redirectToFrontendLogin(HttpServletResponse response) throws IOException {
        // Sanitize to remove any CR/LF that might have been added when saving the env var
        String cleanUrl = frontendUrl.replaceAll("[\\r\\n]", "").trim();
        response.sendRedirect(cleanUrl + "/login");
    }
}
