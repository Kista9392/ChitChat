package com.social.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    /** The developer's Gmail — all bug reports and suggestions go here */
    public static final String DEVELOPER_EMAIL = "kistareddypullagurla123@gmail.com";

    // Optional injection — app starts even if mail is not configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:NOT_SET}")
    private String mailUsername;

    /**
     * Returns true only when both the mail bean exists AND the username
     * is a real address (not the placeholder default).
     */
    private boolean isMailConfigured() {
        return mailSender != null
                && mailUsername != null
                && !mailUsername.isBlank()
                && !mailUsername.equals("NOT_SET")
                && !mailUsername.equals("noreply@example.com");
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
            helper.setFrom(mailUsername, "ChitChat");
            helper.setTo(toEmail);
            helper.setSubject("Your ChitChat Password Reset Code");
            String htmlContent = "<div style='font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e5e7eb;'>"
                    + "<h2 style='color:#4F46E5;'>🔐 Password Reset</h2>"
                    + "<p>Hi there! You requested a password reset for your ChitChat account.</p>"
                    + "<p>Here is your 6-digit code:</p>"
                    + "<h1 style='letter-spacing:10px;color:#4F46E5;background:#EEF2FF;padding:16px;border-radius:8px;text-align:center;'>" + otp + "</h1>"
                    + "<p style='color:#6b7280;font-size:13px;'>⏱ This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>"
                    + "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>"
                    + "<p style='color:#9ca3af;font-size:11px;'>ChitChat — Connecting people securely.</p>"
                    + "</div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("OTP email sent successfully to: " + toEmail);
        } catch (MessagingException | UnsupportedEncodingException e) {
            System.err.println("FAILED TO SEND EMAIL: " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
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
            helper.setFrom(mailUsername, "ChitChat Security");
            helper.setTo(toEmail);
            helper.setSubject("New Login Detected - ChitChat");
            String htmlContent = "<div style='font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e5e7eb;'>"
                    + "<h2 style='color:#DC2626;'>⚠️ New Login Detected</h2>"
                    + "<p>Hi <strong>" + username + "</strong>,</p>"
                    + "<p>Your ChitChat account was just logged into via Google.</p>"
                    + "<p>If this was you, you can safely ignore this email.</p>"
                    + "<p style='color:#DC2626;'><strong>If this wasn't you, please secure your account immediately.</strong></p>"
                    + "</div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
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
            helper.setFrom(mailUsername, "ChitChat Reports");
            helper.setTo(developerEmail);
            helper.setSubject("[ChitChat] " + subject);
            String htmlContent = "<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e5e7eb;'>"
                    + "<h2 style='color:#4F46E5;'>📩 ChitChat Report</h2>"
                    + "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>"
                    + "<tr><td style='padding:8px;background:#f9fafb;font-weight:bold;width:100px;'>From</td><td style='padding:8px;'>@" + senderUsername + "</td></tr>"
                    + "<tr><td style='padding:8px;background:#f9fafb;font-weight:bold;'>Type</td><td style='padding:8px;'>" + subject + "</td></tr>"
                    + "</table>"
                    + "<div style='background:#f3f4f6;padding:16px;border-radius:8px;color:#1f2937;line-height:1.6;'>"
                    + body.replace("\n", "<br/>")
                    + "</div>"
                    + "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>"
                    + "<p style='color:#9ca3af;font-size:11px;'>ChitChat — Auto-generated report</p>"
                    + "</div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("Developer email sent to: " + developerEmail);
        } catch (MessagingException | UnsupportedEncodingException e) {
            System.err.println("FAILED TO SEND DEVELOPER EMAIL: " + e.getMessage());
        }
    }
}

