package com.social.backend.controller;

import com.social.backend.dto.MessageRequest;
import com.social.backend.dto.MessageResponse;
import com.social.backend.service.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/messages")
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/{receiverUsername}")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable String receiverUsername,
            @RequestBody MessageRequest request,
            Authentication authentication
    ) {
        MessageResponse response = messageService.sendMessage(
                authentication.getName(),
                receiverUsername,
                request.content(),
                request.messageType(),
                request.mediaUrl()
        );

        // Push the message to BOTH sender and receiver via WebSocket in real-time
        messagingTemplate.convertAndSend("/topic/messages/" + response.receiverUsername(), response);
        messagingTemplate.convertAndSend("/topic/messages/" + response.senderUsername(), response);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{receiverUsername}/image", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendImageMessage(
            @PathVariable String receiverUsername,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Authentication authentication
    ) {
        MessageResponse response = messageService.sendImageMessage(
                authentication.getName(),
                receiverUsername,
                file
        );

        messagingTemplate.convertAndSend("/topic/messages/" + response.receiverUsername(), response);
        messagingTemplate.convertAndSend("/topic/messages/" + response.senderUsername(), response);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{receiverUsername}/voice", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendVoiceMessage(
            @PathVariable String receiverUsername,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Authentication authentication
    ) {
        MessageResponse response = messageService.sendVoiceMessage(
                authentication.getName(),
                receiverUsername,
                file
        );

        messagingTemplate.convertAndSend("/topic/messages/" + response.receiverUsername(), response);
        messagingTemplate.convertAndSend("/topic/messages/" + response.senderUsername(), response);

        return ResponseEntity.ok(response);
    }

    // Notice we fetch 50 messages per page for chats, instead of 10!
    @GetMapping("/{otherUsername}")
    public ResponseEntity<Page<MessageResponse>> getConversation(
            @PathVariable String otherUsername,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<MessageResponse> response = messageService.getConversation(authentication.getName(), otherUsername, pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{senderUsername}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String senderUsername, Authentication authentication) {
        messageService.markMessagesAsRead(authentication.getName(), senderUsername);
        return ResponseEntity.ok().build();
    }
}
