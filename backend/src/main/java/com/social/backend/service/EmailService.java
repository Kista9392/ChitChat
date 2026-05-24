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
 * Email service using the Brevo (formerly Sendinblue) REST API.
 *
 * WHY BREVO instead of Resend?
 * Resend's free "onboarding@resend.dev" sender can ONLY deliver to the Resend
 * account owner's email. Other users (friends, real users) never receive anything.
 * Brevo's free plan sends to ANY email address (300/day, 9,000/month) using
 * just a verified sender email — no domain ownership required.
 *
 * SETUP (one-time, ~2 minutes):
 *   1. Sign up free at https://app.brevo.com
 *   2. Go to Settings → Senders & IP → Add a Sender:
 *         Email: kistareddypullagurla123@gmail.com
 *         Name:  ChitChat
 *      → Click the verification link Brevo sends to your Gmail
 *   3. Go to Settings → API Keys → Generate API Key → copy it
 *   4. In HF Space → Settings → Repository secrets:
 *         BREVO_API_KEY = xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx
 */
@Service
public class EmailService {

    /** Developer email — all bug reports and suggestions are sent here */
    public static final String DEVELOPER_EMAIL = "kistareddypullagurla123@gmail.com";

    private static final String BREVO_API_URL  = "https://api.brevo.com/v3/smtp/email";
    private static final String SENDER_NAME    = "ChitChat";
    private static final String SENDER_EMAIL   = DEVELOPER_EMAIL; // Must be verified in Brevo

    @Value("${BREVO_API_KEY:NOT_SET}")
    private String brevoApiKey;

    private final HttpClient    httpClient   = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private final ObjectMapper  objectMapper = new ObjectMapper();

    private boolean isConfigured() {
        if (brevoApiKey == null || brevoApiKey.isBlank() || brevoApiKey.equals("NOT_SET")) {
            System.err.println("[EmailService] BREVO_API_KEY is not set in environment!");
            return false;
        }
        System.out.println("[EmailService] BREVO_API_KEY found, length=" + brevoApiKey.length()
                + ", prefix=" + brevoApiKey.substring(0, Math.min(10, brevoApiKey.length())) + "...");
        return true;
    }

    /**
     * Synchronous version — returns the raw Brevo API response for debugging.
     * Called from the test endpoint to surface any errors immediately.
     */
    public String testEmail(String to) {
        if (!isConfigured()) {
            return "ERROR: BREVO_API_KEY not set or empty in HF Secrets.";
        }
        try {
            Map<String, Object> payload = Map.of(
                "sender",      Map.of("name", SENDER_NAME, "email", SENDER_EMAIL),
                "to",          List.of(Map.of("email", to)),
                "subject",     "ChitChat Email Test",
                "htmlContent", "<p>This is a test email from ChitChat. If you received this, email is working!</p>"
            );
            String json = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key",      brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept",       "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(20))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return "HTTP " + response.statusCode() + ": " + response.body();
        } catch (Exception e) {
            return "EXCEPTION: " + e.getClass().getSimpleName() + " - " + e.getMessage();
        }
    }

    /**
     * Core async send — fires HTTPS POST to Brevo API.
     */
    @Async
    public void sendEmail(String to, String subject, String htmlBody) {
        System.out.println("=== EmailService: to=" + to + " | subject=" + subject);

        if (!isConfigured()) return;

        try {
            Map<String, Object> payload = Map.of(
                "sender",      Map.of("name", SENDER_NAME, "email", SENDER_EMAIL),
                "to",          List.of(Map.of("email", to)),
                "subject",     subject,
                "htmlContent", htmlBody
            );

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key",      brevoApiKey.trim())
                    .header("Content-Type", "application/json")
                    .header("Accept",       "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                System.out.println("[EmailService] ✅ Sent OK to " + to + " | " + response.body());
            } else {
                System.err.println("[EmailService] ❌ Brevo error HTTP " + response.statusCode()
                        + " | Body: " + response.body()
                        + " | Sender: " + SENDER_EMAIL
                        + " | To: " + to);
            }

        } catch (Exception e) {
            System.err.println("[EmailService] ❌ EXCEPTION: " + e.getClass().getSimpleName()
                    + " - " + e.getMessage());
        }
    }

    // ─── Public email methods ────────────────────────────────────────────────

    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("=================================================");
        System.out.println("DEBUG OTP for " + toEmail + " : " + otp);
        System.out.println("=================================================");

        String html =
            "<div style='font-family:Inter,sans-serif;max-width:480px;margin:auto;" +
            "padding:32px;border-radius:16px;border:1px solid #e5e7eb;background:#fff;'>" +
            "<div style='text-align:center;margin-bottom:24px;'>" +
            "<div style='display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);" +
            "border-radius:12px;padding:12px;'>" +
            "<span style='font-size:28px;'>&#128272;</span></div>" +
            "<h1 style='color:#18181b;font-size:22px;margin:16px 0 4px;'>Password Reset</h1>" +
            "<p style='color:#71717a;font-size:14px;margin:0;'>ChitChat</p></div>" +
            "<p style='color:#3f3f46;font-size:15px;'>Your 6-digit verification code:</p>" +
            "<div style='background:linear-gradient(135deg,#EEF2FF,#F5F3FF);border:2px solid #C7D2FE;" +
            "border-radius:12px;padding:24px;text-align:center;margin:16px 0;'>" +
            "<span style='font-size:40px;font-weight:800;letter-spacing:14px;color:#4F46E5;'>"
            + otp + "</span></div>" +
            "<p style='color:#71717a;font-size:13px;text-align:center;'>" +
            "&#9200; Expires in <strong>5 minutes</strong>. Never share this code.</p>" +
            "<hr style='border:none;border-top:1px solid #f4f4f5;margin:24px 0;'/>" +
            "<p style='color:#a1a1aa;font-size:11px;text-align:center;'>" +
            "If you didn't request this, please ignore this email.</p>" +
            "</div>";

        sendEmail(toEmail, "Your ChitChat Password Reset Code", html);
    }

    @Async
    public void sendLoginNotificationEmail(String toEmail, String username) {
        String html =
            "<div style='font-family:Inter,sans-serif;max-width:480px;margin:auto;" +
            "padding:32px;border-radius:16px;border:1px solid #e5e7eb;background:#fff;'>" +
            "<h2 style='color:#DC2626;'>&#9888;&#65039; New Login Detected</h2>" +
            "<p style='color:#3f3f46;'>Hi <strong>" + username + "</strong>,</p>" +
            "<p style='color:#3f3f46;'>Your ChitChat account was just logged in via Google.</p>" +
            "<p style='color:#3f3f46;'>If this was you, you can safely ignore this email.</p>" +
            "<div style='background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;" +
            "padding:12px;margin:16px 0;'>" +
            "<p style='color:#DC2626;margin:0;font-weight:600;'>" +
            "If this wasn't you, secure your account immediately!</p></div>" +
            "<hr style='border:none;border-top:1px solid #f4f4f5;margin:24px 0;'/>" +
            "<p style='color:#a1a1aa;font-size:11px;'>ChitChat Security Team</p>" +
            "</div>";

        sendEmail(toEmail, "New Login Detected - ChitChat", html);
    }

    @Async
    public void sendDeveloperEmail(String developerEmail, String senderUsername,
                                   String subject, String body) {
        System.out.println("[EmailService] Report from @" + senderUsername
                + " → " + developerEmail + " | " + subject);

        String html =
            "<div style='font-family:Inter,sans-serif;max-width:600px;margin:auto;" +
            "padding:32px;border-radius:16px;border:1px solid #e5e7eb;background:#fff;'>" +
            "<h2 style='color:#4F46E5;'>&#128233; ChitChat Report</h2>" +
            "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;" +
            "border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;'>" +
            "<tr><td style='padding:10px 14px;background:#f9fafb;font-weight:700;" +
            "width:80px;color:#6b7280;font-size:13px;'>FROM</td>" +
            "<td style='padding:10px 14px;color:#18181b;font-weight:600;'>@"
            + senderUsername + "</td></tr>" +
            "<tr><td style='padding:10px 14px;background:#f9fafb;font-weight:700;" +
            "color:#6b7280;font-size:13px;'>TYPE</td>" +
            "<td style='padding:10px 14px;color:#18181b;'>" + subject + "</td></tr>" +
            "</table>" +
            "<div style='background:#f9fafb;padding:16px;border-radius:8px;" +
            "color:#3f3f46;line-height:1.7;border:1px solid #e5e7eb;'>" +
            body.replace("\n", "<br/>") + "</div>" +
            "<hr style='border:none;border-top:1px solid #f4f4f5;margin:24px 0;'/>" +
            "<p style='color:#a1a1aa;font-size:11px;'>ChitChat &mdash; Auto-generated report</p>" +
            "</div>";

        sendEmail(developerEmail, "[ChitChat] " + subject, html);
    }
}
