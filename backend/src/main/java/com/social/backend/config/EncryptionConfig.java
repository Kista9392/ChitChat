package com.social.backend.config;

import com.social.backend.util.EncryptionConverter;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class EncryptionConfig {

    @Value("${app.encryption-key:ThisIsASecretKey}")
    private String encryptionKey;

    @PostConstruct
    public void init() {
        // Must be exactly 16 characters for AES-128
        String key = encryptionKey;
        if (key.length() < 16) {
            key = String.format("%-16s", key); // pad with spaces
        } else if (key.length() > 16) {
            key = key.substring(0, 16); // truncate
        }
        EncryptionConverter.setKey(key);
    }
}
