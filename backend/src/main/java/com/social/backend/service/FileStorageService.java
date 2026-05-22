package com.social.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import java.util.Map;

@Service
public class FileStorageService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Cloudinary cloudinary;
    private Path localUploadRoot;

    @PostConstruct
    public void init() {
        // ALWAYS try to create local uploads directory as a fallback
        localUploadRoot = Paths.get(uploadDir);
        try {
            if (!Files.exists(localUploadRoot)) {
                Files.createDirectories(localUploadRoot);
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not create local uploads directory at " + uploadDir + ". Configure Cloudinary for production.");
            localUploadRoot = null;
        }

        if (cloudName != null && !cloudName.trim().isEmpty()) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
            ));
        }
    }

    public String save(MultipartFile file) {
        // If Cloudinary credentials are provided, upload directly to Cloudinary
        if (cloudinary != null) {
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("resource_type", "auto")
                );
                return (String) uploadResult.get("secure_url");
            } catch (Exception e) {
                System.err.println("Cloudinary upload failed: " + e.getMessage() + ". Attempting local fallback...");
                if (localUploadRoot == null) {
                    throw new RuntimeException("Could not upload to Cloudinary: " + e.getMessage() + " (and no local storage fallback is configured)");
                }
            }
        }

        // Fallback to local storage
        if (localUploadRoot == null) {
            throw new RuntimeException("No file storage configured. Please set Cloudinary environment variables.");
        }
        try {
            String extension = getFileExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID().toString() + extension;
            Files.copy(file.getInputStream(), localUploadRoot.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (Exception e) {
            throw new RuntimeException("Could not store the file: " + e.getMessage());
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return ".jpg";
        int lastIndex = fileName.lastIndexOf('.');
        if (lastIndex == -1) return ".jpg";
        return fileName.substring(lastIndex);
    }
}

