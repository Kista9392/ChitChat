package com.social.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Redis-backed sliding-window rate limiter.
 *
 * Limits per IP address:
 *   /api/v1/auth/**  → 20 requests per minute  (prevents brute-force & OTP spam)
 *   All other APIs   → 200 requests per minute  (prevents API abuse)
 *
 * Uses a simple counter key in Redis:  ratelimit:{scope}:{ip}:{window}
 * The window is the current epoch-minute (changes every 60s automatically).
 * Each key has a 60-second TTL, so the window resets cleanly.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_LIMIT    = 20;   // per minute for auth endpoints
    private static final int GENERAL_LIMIT = 200;  // per minute for all other endpoints

    private final StringRedisTemplate redis;

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ip   = getClientIp(request);
        String path = request.getRequestURI();

        // Skip rate limiting for static assets and WebSocket
        if (path.startsWith("/uploads/") || path.startsWith("/ws/")
                || path.equals("/actuator/health")) {
            chain.doFilter(request, response);
            return;
        }

        boolean isAuthPath = path.startsWith("/api/v1/auth/");
        int     limit      = isAuthPath ? AUTH_LIMIT : GENERAL_LIMIT;
        String  scope      = isAuthPath ? "auth" : "api";

        // Current minute bucket (epoch-second / 60)
        long   window = System.currentTimeMillis() / 60_000;
        String key    = "ratelimit:" + scope + ":" + ip + ":" + window;

        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1) {
                // First hit in this window — set TTL of 65s (a little extra buffer)
                redis.expire(key, 65, TimeUnit.SECONDS);
            }

            if (count != null && count > limit) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                int retryAfter = (int)(60 - (System.currentTimeMillis() / 1000) % 60);
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.getWriter().write(
                    "{\"error\":\"Too many requests. Please slow down and try again in "
                    + retryAfter + " seconds.\",\"status\":429}"
                );
                return;
            }
        } catch (Exception e) {
            // If Redis is down, fail OPEN (allow the request) — app stays functional
            logger.warn("Rate limit Redis error (failing open): " + e.getMessage());
        }

        chain.doFilter(request, response);
    }

    /**
     * Extracts the real client IP, respecting common reverse-proxy headers.
     * HF Spaces sits behind a proxy, so X-Forwarded-For is the real IP.
     */
    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For can be a comma-separated list; take the first (original client)
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
