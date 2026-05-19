package com.social.backend.service;

import com.social.backend.dto.MessageResponse;
import com.social.backend.entity.Message;
import com.social.backend.entity.MessageType;
import com.social.backend.entity.NotificationType;
import com.social.backend.entity.User;
import com.social.backend.repository.FollowRepository;
import com.social.backend.repository.MessageRepository;
import com.social.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;

    @org.springframework.beans.factory.annotation.Value("${app.api-url:http://localhost:8080}")
    private String apiUrl;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository, FollowRepository followRepository, NotificationService notificationService, FileStorageService fileStorageService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.notificationService = notificationService;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public MessageResponse sendMessage(String senderEmail, String receiverUsername, String content, String messageTypeStr, String mediaUrl) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        // Relaxed rule: Allow if either follows the other!
        boolean isFollowing = followRepository.findByFollowerAndFollowing(sender, receiver).isPresent();
        boolean isFollowedBy = followRepository.findByFollowerAndFollowing(receiver, sender).isPresent();
        if (!isFollowing && !isFollowedBy) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "You can only message people who follow you or you follow them!");
        }

        MessageType messageType = MessageType.TEXT;
        if (messageTypeStr != null) {
            try {
                messageType = MessageType.valueOf(messageTypeStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Default to TEXT
            }
        }

        Message message = new Message(sender, receiver, content, mediaUrl, messageType);
        Message savedMessage = messageRepository.save(message);

        notificationService.sendNotification(receiver.getId(), sender.getId(), NotificationType.MESSAGE, sender.getUsername() + " sent you a message");

        return new MessageResponse(
                savedMessage.getId(),
                savedMessage.getSender().getUsername(),
                savedMessage.getReceiver().getUsername(),
                savedMessage.getContent(),
                savedMessage.getCreatedAt(),
                savedMessage.getReadAt(),
                savedMessage.getMediaUrl(),
                savedMessage.getMessageType().name()
        );
    }

    @Transactional
    public MessageResponse sendImageMessage(String senderEmail, String receiverUsername, MultipartFile file) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        boolean isFollowing = followRepository.findByFollowerAndFollowing(sender, receiver).isPresent();
        if (!isFollowing) {
            throw new RuntimeException("You can only message people you follow!");
        }

        String filename = fileStorageService.save(file);
        String mediaUrl = filename.startsWith("http") ? filename : (apiUrl + "/uploads/" + filename);

        Message message = new Message(sender, receiver, "[Image]", mediaUrl, MessageType.IMAGE);
        Message savedMessage = messageRepository.save(message);

        notificationService.sendNotification(receiver.getId(), sender.getId(), NotificationType.MESSAGE, sender.getUsername() + " sent you an image");

        return new MessageResponse(
                savedMessage.getId(),
                savedMessage.getSender().getUsername(),
                savedMessage.getReceiver().getUsername(),
                savedMessage.getContent(),
                savedMessage.getCreatedAt(),
                savedMessage.getReadAt(),
                savedMessage.getMediaUrl(),
                savedMessage.getMessageType().name()
        );
    }

    @Transactional
    public MessageResponse sendVoiceMessage(String senderEmail, String receiverUsername, MultipartFile file) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        boolean isFollowing = followRepository.findByFollowerAndFollowing(sender, receiver).isPresent();
        if (!isFollowing) {
            throw new RuntimeException("You can only message people you follow!");
        }

        String filename = fileStorageService.save(file);
        String mediaUrl = filename.startsWith("http") ? filename : (apiUrl + "/uploads/" + filename);

        Message message = new Message(sender, receiver, "[Voice Message]", mediaUrl, MessageType.VOICE);
        Message savedMessage = messageRepository.save(message);

        notificationService.sendNotification(receiver.getId(), sender.getId(), NotificationType.MESSAGE, sender.getUsername() + " sent you a voice message");

        return new MessageResponse(
                savedMessage.getId(),
                savedMessage.getSender().getUsername(),
                savedMessage.getReceiver().getUsername(),
                savedMessage.getContent(),
                savedMessage.getCreatedAt(),
                savedMessage.getReadAt(),
                savedMessage.getMediaUrl(),
                savedMessage.getMessageType().name()
        );
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> getConversation(String currentUserEmail, String otherUsername, Pageable pageable) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User otherUser = userRepository.findByUsername(otherUsername)
                .orElseThrow(() -> new RuntimeException("Other user not found"));

        Page<Message> messages = messageRepository.findConversation(currentUser, otherUser, pageable);

        return messages.map(msg -> new MessageResponse(
                msg.getId(),
                msg.getSender().getUsername(),
                msg.getReceiver().getUsername(),
                msg.getContent(),
                msg.getCreatedAt(),
                msg.getReadAt(),
                msg.getMediaUrl(),
                msg.getMessageType().name()
        ));
    }

    @Transactional
    public void markMessagesAsRead(String receiverEmail, String senderUsername) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        java.util.List<Message> unreadMessages = messageRepository.findBySenderAndReceiverAndReadAtIsNull(sender, receiver);
        for (Message m : unreadMessages) {
            m.setReadAt(java.time.LocalDateTime.now());
        }
        messageRepository.saveAll(unreadMessages);
    }
}
