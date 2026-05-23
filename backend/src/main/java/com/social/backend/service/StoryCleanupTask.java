package com.social.backend.service;

import com.social.backend.repository.StoryRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StoryCleanupTask {

    private final StoryRepository storyRepository;

    public StoryCleanupTask(StoryRepository storyRepository) {
        this.storyRepository = storyRepository;
    }

    // Run at the top of every hour: "0 0 * * * *"
    // For testing purposes, we could run it every minute: "0 * * * * *"
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredStories() {
        System.out.println("--- STARTING BACKGROUND STORY CLEANUP ---");
        storyRepository.deleteExpiredStories(LocalDateTime.now().minusHours(24));
        System.out.println("--- FINISHED BACKGROUND STORY CLEANUP ---");
    }
}
