package com.social.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		// Clean environment variables with literal quotes to prevent configuration binding issues
		System.getenv().forEach((key, value) -> {
			if (value != null) {
				String cleaned = value.trim();
				boolean changed = false;
				if (cleaned.startsWith("\"") && cleaned.endsWith("\"") && cleaned.length() >= 2) {
					cleaned = cleaned.substring(1, cleaned.length() - 1);
					changed = true;
				} else if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length() >= 2) {
					cleaned = cleaned.substring(1, cleaned.length() - 1);
					changed = true;
				}
				if (changed) {
					System.setProperty(key, cleaned);
				}
			}
		});

		SpringApplication.run(BackendApplication.class, args);
	}

}
