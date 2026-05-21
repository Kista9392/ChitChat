package com.social.backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String cleanUrl = frontendUrl.replaceAll("[\\r\\n]", "").trim();
        String errorMessage = exception.getLocalizedMessage();
        if (errorMessage == null) {
            errorMessage = "OAuth2 authentication failed";
        }
        
        System.err.println("=== OAuth2 Authentication Failure ===");
        System.err.println("Error details: " + errorMessage);
        exception.printStackTrace();

        String redirectUrl = cleanUrl + "/login?error=" + URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }
}
