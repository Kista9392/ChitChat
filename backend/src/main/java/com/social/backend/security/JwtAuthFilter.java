package com.social.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Look for the "Authorization" header in the HTTP Request
        final String authHeader = request.getHeader("Authorization");

        // 2. If it's missing or doesn't start with "Bearer ", this request isn't trying to use a JWT.
        // Let it pass through. Spring Security will block it later if it's trying to access a protected route.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract the token (Remove "Bearer " which is exactly 7 characters)
        final String jwt = authHeader.substring(7);
        
        try {
            // 4. Extract the email from the token using our cryptographic secret
            final String userEmail = jwtService.extractEmail(jwt);

            // 5. If we found an email, and this request hasn't been authenticated yet...
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // 6. Double check that the token isn't expired and math checks out
                if (jwtService.isTokenValid(jwt, userEmail)) {
                    
                    // 7. Success! Tell Spring Security: "I vouch for this person."
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            new ArrayList<>() // We will add Roles (like ADMIN) here later
                    );
                    
                    // We save the authenticated user in the "SecurityContext" for this specific request
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // If the token is fake, expired, or tampered with, it throws an exception.
            // We just catch it silently. The user will remain unauthenticated and get a 403 Forbidden.
        }

        // 8. Always continue the chain!
        filterChain.doFilter(request, response);
    }
}
