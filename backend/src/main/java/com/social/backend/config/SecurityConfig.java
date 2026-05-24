package com.social.backend.config;

import com.social.backend.security.JwtAuthFilter;
import com.social.backend.security.OAuth2SuccessHandler;
import com.social.backend.security.RateLimitFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter    jwtAuthFilter;
    private final RateLimitFilter  rateLimitFilter;

    @Autowired(required = false)
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Autowired(required = false)
    private com.social.backend.security.OAuth2FailureHandler oAuth2FailureHandler;

    @Autowired(required = false)
    private ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthFilter   = jwtAuthFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/v1/auth/login",
                    "/api/v1/auth/register",
                    "/api/v1/auth/forgot-password",
                    "/api/v1/auth/reset-password",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/debug/oauth",
                    "/api/v1/auth/debug/test-email",
                    "/api/v1/auth/debug/follows",
                    "/api/v1/auth/debug/fix-usernames",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/login/**",
                    "/uploads/**",
                    "/ws/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                    org.springframework.http.HttpStatus.UNAUTHORIZED))
            );

        if (clientRegistrationRepository != null) {
            http.oauth2Login(oauth2 -> {
                if (oAuth2SuccessHandler != null) {
                    oauth2.successHandler(oAuth2SuccessHandler);
                }
                if (oAuth2FailureHandler != null) {
                    oauth2.failureHandler(oAuth2FailureHandler);
                }
            });
        }

        // Rate limiter runs FIRST — before JWT auth — so abusive IPs are blocked cheaply
        http.addFilterBefore(rateLimitFilter,  UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthFilter,    UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        String frontendUrl = System.getenv("FRONTEND_URL");
        java.util.List<String> origins = new java.util.ArrayList<>(java.util.Arrays.asList(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://kittu9392-chitchat-backend.hf.space",
            "https://chit-chat-beta-seven.vercel.app",
            "https://vibely-social.vercel.app"
        ));
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            origins.add(frontendUrl.replaceAll("[\\r\\n]", "").trim());
        }
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(java.util.Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
