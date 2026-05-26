package com.social.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		// Set JVM Default TimeZone to UTC to align all database operations
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("UTC"));

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

		// Determine upload directory: check if current dir is writable, else use temp dir
		java.io.File uploadsDir = new java.io.File("uploads");
		boolean localWritable = false;
		try {
			if (!uploadsDir.exists()) {
				localWritable = uploadsDir.mkdirs();
			} else {
				localWritable = uploadsDir.canWrite();
			}
			if (localWritable) {
				// Try creating a dummy file to be absolutely sure
				java.io.File dummy = new java.io.File(uploadsDir, ".write-test");
				if (dummy.createNewFile()) {
					dummy.delete();
				} else {
					localWritable = false;
				}
			}
		} catch (Exception e) {
			localWritable = false;
		}

		if (localWritable) {
			System.setProperty("app.upload.dir", "uploads");
		} else {
			String tempDir = System.getProperty("java.io.tmpdir");
			String fallbackPath = tempDir + java.io.File.separator + "pacely-uploads";
			java.io.File fallbackDir = new java.io.File(fallbackPath);
			fallbackDir.mkdirs();
			System.setProperty("app.upload.dir", fallbackDir.getAbsolutePath());
			System.out.println("System property app.upload.dir set to fallback: " + fallbackDir.getAbsolutePath());
		}

		SpringApplication.run(BackendApplication.class, args);
	}

}
