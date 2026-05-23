package com.social.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Email service using the Resend REST API (https://resend.com).
 *
 * WHY RESEND instead of JavaMailSender / SMTP?
 * Hugging Face Spaces blocks all outbound SMTP connections on ports 25, 587 and 465
 * at the network level to prevent spam. No SMTP credentials fix can bypass this.
 * Resend sends via HTTPS (port 443) which is always open, making it the only
 * reliable way to send email from HF Spaces.
 *
 * FREE TIER: 3,000 emails/month, 100/day — more than enough for ChitChat.
 *
 * Setup (one-time):
 *   1. Sign up at https://resend.com (free)
 *   2. Go to API Keys → Create API Key → copy it
 *   3. In HF Space → Settings → Repository secrets:
 *      RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxx
 */
@Service
public class EmailService {

    /** The developer's Gmail — all bug reports and suggestions go here */
    public static final String DEVELOPER_EMAIL = "kistareddypullagurla123@gmail.com";

    /**
     * Sender address shown in the "From" field.
     *
     * On Resend's FREE plan, you can send FROM:
     *   - onboarding@resend.dev  (always works, no domain setup)
     *   - your-domain.com        (after adding DNS records in Resend dashboard)
     *
     * Start with "onboarding@resend.dev" and switch to your custom domain later.
     */
    private static final String FROM_ADDRESS = "ChitChat <onboarding@resend.dev>";

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${RESEND_API_KEY:NOT_SET}")
    private String resendApiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isConfigured() {
        return resendApiKey != null
                && !resendApiKey.isBlank()
                && !resendApiKey.equals("NOT_SET")
                && resendApiKey.startsWith("re_");
    }

    /**
     * Core method: sends an email via the Resend REST API.
     * Uses Java 17 built-in HttpClient — no extra dependencies needed.
     */
    @Async
    public void sendEmail(String to, String subject, String htmlBody) {
        System.out.println("=== EmailService: Sending email to " + to + " | Subject: " + subject);

        if (!isConfigured()) {
            System.err.println(
                "RESEND_API_KEY not set or invalid. " +
                "Add RESEND_API_KEY secret to your HF Space. " +
                "Sign up free at https://resend.com"
            );
            return;
        }

        try {
            Map<String, Object> payload = Map.of(
                "from",    FROM_ADDRESS,
                "to",      List.of(to),
                "subject", subject,
                "html",    htmlBody
            );

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_API_URL))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                System.out.println("Email sent successfully to: " + to + " | Response: " + response.body());
            } else {
                System.err.println("Resend API error " + response.statusCode() + ": " + response.body());
            }

        } catch (Exception e) {
            System.err.println("FAILED TO SEND EMAIL via Resend: " + e.getMessage());
        }
    }

    // ─── Public email methods ────────────────────────────────────────────────

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("=================================================");
        System.out.println("DEBUG: OTP for " + toEmail + " is: " + otp);
        System.out.println("=================================================");

        String html = "<div style='font-family:sans-serif;max-width:480px;margin:auto;padding:24px;" +
                "border-radius:12px;border:1px solid #e5e7eb;'>" +
                "<h2 style='color:#4F46E5;'>&#128272; Password Reset</h2>" +
                "<p>Hi there! You requested a password reset for your <strong>ChitChat</strong> account.</p>" +
                "<p>Your 6-digit verification code:</p>" +
                "<h1 style='letter-spacing:12px;color:#4F46E5;background:#EEF2FF;padding:20px;" +
                "border-radius:8px;text-align:center;font-size:36px;'>" + otp + "</h1>" +
                "<p style='color:#6b7280;font-size:13px;'>&#9200; Expires in <strong>5 minutes</strong>. " +
                "Never share this code with anyone.</p>" +
                "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>" +
                "<p style='color:#9ca3af;font-size:11px;'>ChitChat &mdash; Connecting people securely.</p>" +
                "</div>";

        sendEmail(toEmail, "Your ChitChat Password Reset Code", html);
    }

    @Async
    public void sendLoginNotificationEmail(String toEmail, String username) {
        String html = "<div style='font-family:sans-serif;max-width:480px;margin:auto;padding:24px;" +
                "border-radius:12px;border:1px solid #e5e7eb;'>" +
                "<h2 style='color:#DC2626;'>&#9888;&#65039; New Login Detected</h2>" +
                "<p>Hi <strong>" + username + "</strong>,</p>" +
                "<p>Your ChitChat account was just logged into via <strong>Google</strong>.</p>" +
                "<p>If this was you, you can safely ignore this email.</p>" +
                "<p style='color:#DC2626;'><strong>If this wasn't you, please secure your account immediately.</strong></p>" +
                "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>" +
                "<p style='color:#9ca3af;font-size:11px;'>ChitChat Security Team</p>" +
                "</div>";

        sendEmail(toEmail, "New Login Detected - ChitChat", html);
    }

    @Async
    public void sendDeveloperEmail(String developerEmail, String senderUsername, String subject, String body) {
        System.out.println("=================================================");
        System.out.println("Developer report from @" + senderUsername + " to " + developerEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Body: " + body);
        System.out.println("=================================================");

        String html = "<div style='font-family:sans-serif;max-width:600px;margin:auto;padding:24px;" +
                "border-radius:12px;border:1px solid #e5e7eb;'>" +
                "<h2 style='color:#4F46E5;'>&#128233; ChitChat Report</h2>" +
                "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>" +
                "<tr><td style='padding:8px;background:#f9fafb;font-weight:bold;width:80px;'>From</td>" +
                "<td style='padding:8px;'>@" + senderUsername + "</td></tr>" +
                "<tr><td style='padding:8px;background:#f9fafb;font-weight:bold;'>Type</td>" +
                "<td style='padding:8px;'>" + subject + "</td></tr>" +
                "</table>" +
                "<div style='background:#f3f4f6;padding:16px;border-radius:8px;color:#1f2937;line-height:1.6;'>" +
                body.replace("\n", "<br/>") +
                "</div>" +
                "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>" +
                "<p style='color:#9ca3af;font-size:11px;'>ChitChat &mdash; Auto-generated report</p>" +
                "</div>";

        sendEmail(developerEmail, "[ChitChat] " + subject, html);
    }
}
