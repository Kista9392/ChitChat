package com.social.backend.config;

import com.social.backend.entity.User;
import com.social.backend.repository.UserRepository;
import com.social.backend.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketConfig(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enables an in-memory message broker to carry the messages back to the client on destinations prefixed with "/topic"
        config.enableSimpleBroker("/topic");
        // Prefix for messages sent from the client to the server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Standard WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        // SockJS fallback endpoint for browsers that don't support native WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null) {
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        String authHeader = accessor.getFirstNativeHeader("Authorization");
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                            String token = authHeader.substring(7);
                            try {
                                String email = jwtService.extractEmail(token);
                                if (email != null && jwtService.isTokenValid(token, email)) {
                                    User user = userRepository.findByEmail(email).orElse(null);
                                    if (user != null) {
                                        UsernamePasswordAuthenticationToken authToken = 
                                            new UsernamePasswordAuthenticationToken(user.getUsername(), null, new java.util.ArrayList<>());
                                        accessor.setUser(authToken);
                                    }
                                }
                            } catch (Exception e) {
                                // Connection will fail to authenticate but standard connection may pass without principal
                            }
                        }
                    } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        String destination = accessor.getDestination();
                        java.security.Principal principal = accessor.getUser();
                        
                        if (destination != null) {
                            // Enforce authorization for private queues
                            if (destination.startsWith("/topic/messages/")) {
                                String targetUser = destination.substring("/topic/messages/".length());
                                if (principal == null || !principal.getName().equalsIgnoreCase(targetUser)) {
                                    throw new org.springframework.security.access.AccessDeniedException(
                                        "Unauthorized subscription to destination: " + destination
                                    );
                                }
                            }
                            
                            if (destination.startsWith("/topic/notifications/")) {
                                String targetUser = destination.substring("/topic/notifications/".length());
                                if (principal == null || !principal.getName().equalsIgnoreCase(targetUser)) {
                                    throw new org.springframework.security.access.AccessDeniedException(
                                        "Unauthorized subscription to destination: " + destination
                                    );
                                }
                            }
                        }
                    }
                }
                
                return message;
            }
        });
    }
}

