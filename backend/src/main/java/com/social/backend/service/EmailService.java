package com.social.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    // Optional injection — app starts even if mail is not configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    private boolean isMailConfigured() {
        return mailSender != null;
    }

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("========================================");
        System.out.println("DEBUG: OTP for " + toEmail + " is: " + otp);
        System.out.println("========================================");

        if (!isMailConfigured()) {
            System.err.println("Mail not configured — skipping OTP email. Check SPRING_MAIL_USERNAME and SPRING_MAIL_PASSWORD.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("Your Password Reset Code");
            String htmlContent = "<h2>Password Reset</h2>"
                    + "<p>You requested a password reset. Here is your 6-digit code:</p>"
                    + "<h1 style='color: #4F46E5; letter-spacing: 5px;'>" + otp + "</h1>"
                    + "<p>This code will expire in 5 minutes.</p>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("FAILED TO SEND EMAIL: " + e.getMessage());
            throw new RuntimeException("Failed to send email");
        }
    }

    @Async
    public void sendLoginNotificationEmail(String toEmail, String username) {
        if (!isMailConfigured()) {
            return; // Silently skip if mail not configured
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("New Login Detected - ChitChat");
            String htmlContent = "<h2>New Login Detected</h2>"
                    + "<p>Hi <strong>" + username + "</strong>,</p>"
                    + "<p>Your ChitChat account was just logged into via Google.</p>"
                    + "<p>If this was you, you can ignore this email. If not, please secure your account immediately.</p>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("FAILED TO SEND LOGIN EMAIL: " + e.getMessage());
        }
    }

    @Async
    public void sendDeveloperEmail(String developerEmail, String senderUsername, String subject, String body) {
        System.out.println("========================================");
        System.out.println("DEBUG: Sending report/suggestion from " + senderUsername + " to developer " + developerEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Body: " + body);
        System.out.println("========================================");

        if (!isMailConfigured()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(developerEmail);
            helper.setSubject(subject);
            String htmlContent = "<h2>ChitChat Secure Report</h2>"
                    + "<p><strong>From:</strong> @" + senderUsername + "</p>"
                    + "<p><strong>Type:</strong> " + subject + "</p>"
                    + "<div style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 10px; font-family: sans-serif; color: #1f2937;'>"
                    + body.replace("\n", "<br/>")
                    + "</div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("FAILED TO SEND DEVELOPER EMAIL: " + e.getMessage());
        }
    }
}

