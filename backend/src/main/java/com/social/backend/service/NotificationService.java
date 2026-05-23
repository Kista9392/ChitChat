package com.social.backend.service;

import com.social.backend.dto.NotificationResponse;
import com.social.backend.entity.Notification;
import com.social.backend.entity.NotificationType;
import com.social.backend.entity.User;
import com.social.backend.repository.NotificationRepository;
import com.social.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate; // The WebSocket engine!

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // @Async means this method runs on a separate background thread!
    // It will not slow down the main HTTP request that triggered it.
    @Async
    @Transactional
    public void sendNotification(java.util.UUID recipientId, java.util.UUID actorId, NotificationType type, String messageText) {
        // Load users inside the async thread to ensure session is open
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new RuntimeException("Actor not found"));

        // Don't notify yourself if you like your own post
        if (recipient.getId().equals(actor.getId())) {
            return;
        }

        Notification notification = new Notification(recipient, actor, type, messageText);
        Notification savedNotification = notificationRepository.save(notification);

        NotificationResponse response = new NotificationResponse(
                savedNotification.getId(),
                actor.getUsername(),
                type.name(),
                messageText,
                false,
                savedNotification.getCreatedAt()
        );

        // Broadcast it instantly over WebSockets to ONLY this specific user if enabled!
        if (recipient.isPushNotificationsEnabled()) {
            messagingTemplate.convertAndSend("/topic/notifications/" + recipient.getUsername(), response);
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(notif -> new NotificationResponse(
                        notif.getId(),
                        notif.getActor().getUsername(),
                        notif.getType().name(),
                        notif.getMessage(),
                        notif.isRead(),
                        notif.getCreatedAt()
                ));
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        java.util.List<Notification> unread = notificationRepository.findByRecipientAndIsReadFalse(user);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void markAsRead(java.util.UUID notificationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (notification.getRecipient().getId().equals(user.getId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }
}
