package com.social.backend.service;

import com.social.backend.dto.StoryResponse;
import com.social.backend.entity.MediaType;
import com.social.backend.entity.Story;
import com.social.backend.entity.User;
import com.social.backend.repository.StoryRepository;
import com.social.backend.repository.UserRepository;
import com.social.backend.repository.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PostRepository postRepository;

    @org.springframework.beans.factory.annotation.Value("${app.api-url:http://localhost:8080}")
    private String apiUrl;

    public StoryService(StoryRepository storyRepository, UserRepository userRepository, FileStorageService fileStorageService, PostRepository postRepository) {
        this.storyRepository = storyRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.postRepository = postRepository;
    }

    @Transactional
    public StoryResponse createStory(String email, MultipartFile file, String mediaTypeStr) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String filename = fileStorageService.save(file);
        String mediaUrl = filename.startsWith("http") ? filename : (apiUrl + "/uploads/" + filename);

        MediaType mediaType = MediaType.IMAGE;
        if (mediaTypeStr != null && mediaTypeStr.equalsIgnoreCase("VIDEO")) {
            mediaType = MediaType.VIDEO;
        }

        Story story = new Story(user, mediaUrl, mediaType);
        Story savedStory = storyRepository.save(story);

        return mapToResponse(savedStory);
    }

    @Transactional
    public StoryResponse createStoryFromPost(String email, UUID postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.social.backend.entity.Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Story story = new Story(user, post.getMediaUrl(), post.getMediaType());
        Story savedStory = storyRepository.save(story);

        return mapToResponse(savedStory);
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getActiveStories(String email) {
        // user check is still good to verify auth
        userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Story> stories = storyRepository.findActiveStories();

        return stories.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteStory(String email, UUID storyId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own stories");
        }

        storyRepository.delete(story);
    }

    private StoryResponse mapToResponse(Story story) {
        return new StoryResponse(
                story.getId(),
                story.getMediaUrl(),
                story.getMediaType() != null ? story.getMediaType().name() : "IMAGE",
                story.getUser().getUsername(),
                story.getUser().getAvatarUrl(),
                story.getCreatedAt()
        );
    }
}
