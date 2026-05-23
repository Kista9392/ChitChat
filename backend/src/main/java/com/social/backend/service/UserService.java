package com.social.backend.service;

import com.social.backend.dto.AuthResponse;
import com.social.backend.dto.UserResponse;
import com.social.backend.entity.Follow;
import com.social.backend.entity.NotificationType;
import com.social.backend.entity.User;
import com.social.backend.repository.FollowRepository;
import com.social.backend.repository.UserRepository;
import com.social.backend.security.JwtService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.social.backend.repository.PostRepository;
import com.social.backend.repository.PostLikeRepository;
import com.social.backend.repository.CommentRepository;
import com.social.backend.entity.Post;
import java.util.List;

import java.util.Optional;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final FileStorageService fileStorageService;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;

    @org.springframework.beans.factory.annotation.Value("${app.api-url:http://localhost:8080}")
    private String apiUrl;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            JwtService jwtService, StringRedisTemplate redisTemplate,
            FollowRepository followRepository, NotificationService notificationService,
            EmailService emailService, FileStorageService fileStorageService,
            PostRepository postRepository, PostLikeRepository postLikeRepository,
            CommentRepository commentRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.redisTemplate = redisTemplate;
        this.followRepository = followRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.fileStorageService = fileStorageService;
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
    }

    public String getUsernameByEmail(String email) {
        return userRepository.findByEmail(email).map(User::getUsername).orElse(null);
    }

    public User registerUser(String username, String email, String rawPassword, String phoneNumber) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new com.social.backend.exception.UserAlreadyExistsException("Email is already taken!");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new com.social.backend.exception.UserAlreadyExistsException("Username is already taken!");
        }

        String hashedPassword = passwordEncoder.encode(rawPassword);
        User newUser = new User(username, email, hashedPassword, phoneNumber);
        return userRepository.save(newUser);
    }

    public AuthResponse loginUser(String identifier, String rawPassword) {
        // ── Account lockout check ────────────────────────────────────────────
        // Resolve email from identifier first (needed for lockout key)
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        String lockKey    = "account_locked:" + user.getEmail();
        String failKey    = "login_fail:"     + user.getEmail();

        try {
            // Check if account is currently locked
            if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
                Long ttl = redisTemplate.getExpire(lockKey, TimeUnit.MINUTES);
                throw new RuntimeException(
                    "Your account is temporarily locked due to too many failed login attempts. " +
                    "Please try again in " + (ttl != null ? ttl : 15) + " minute(s), " +
                    "or reset your password via 'Forgot Password'."
                );
            }
        } catch (RuntimeException re) {
            throw re; // rethrow lockout message as-is
        } catch (Exception e) {
            // Redis down — fail open, allow login attempt
        }

        // ── Password check ───────────────────────────────────────────────────
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            // Increment failed-attempt counter
            try {
                Long attempts = redisTemplate.opsForValue().increment(failKey);
                if (attempts != null && attempts == 1) {
                    redisTemplate.expire(failKey, 15, TimeUnit.MINUTES); // window resets after 15 min
                }
                if (attempts != null && attempts >= 5) {
                    // Lock the account for 15 minutes
                    redisTemplate.opsForValue().set(lockKey, "locked", 15, TimeUnit.MINUTES);
                    redisTemplate.delete(failKey);
                    // Notify user via email so they know what happened
                    emailService.sendEmail(
                        user.getEmail(),
                        "ChitChat Account Temporarily Locked",
                        "<div style='font-family:sans-serif;max-width:480px;margin:auto;padding:24px;" +
                        "border-radius:12px;border:1px solid #e5e7eb;'>" +
                        "<h2 style='color:#DC2626;'>&#128274; Account Locked</h2>" +
                        "<p>Hi <strong>" + user.getUsername() + "</strong>,</p>" +
                        "<p>Your ChitChat account has been <strong>temporarily locked for 15 minutes</strong> " +
                        "after 5 consecutive failed login attempts.</p>" +
                        "<p>If this wasn't you, your account may be under attack. " +
                        "We recommend resetting your password immediately.</p>" +
                        "<a href='https://chit-chat-beta-seven.vercel.app/forgot-password' " +
                        "style='display:inline-block;background:#4F46E5;color:#fff;padding:10px 20px;" +
                        "border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;'>" +
                        "Reset Password</a>" +
                        "<hr style='border:none;border-top:1px solid #e5e7eb;margin:16px 0;'/>" +
                        "<p style='color:#9ca3af;font-size:11px;'>ChitChat Security Team</p>" +
                        "</div>"
                    );
                    throw new RuntimeException(
                        "Your account has been locked for 15 minutes due to 5 failed login attempts. " +
                        "Check your email for details, or use 'Forgot Password' to regain access."
                    );
                }
                long remaining = 5 - (attempts != null ? attempts : 0);
                throw new RuntimeException(
                    "Invalid credentials. " + remaining + " attempt(s) remaining before account lockout."
                );
            } catch (RuntimeException re) {
                throw re;
            } catch (Exception e) {
                throw new RuntimeException("Invalid credentials");
            }
        }

        // ── Successful login — clear any failed attempt counters ─────────────
        try {
            redisTemplate.delete(failKey);
            redisTemplate.delete(lockKey);
        } catch (Exception ignored) { }

        String accessToken  = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        return new AuthResponse(accessToken, refreshToken, user.getUsername(), user.getAvatarUrl());
    }


    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractEmail(refreshToken);
        if (email == null) {
            throw new RuntimeException("Invalid refresh token");
        }

        // Removed Redis check to avoid slow timeouts if Redis is not running.
        // We trust the JWT signature for now.

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(email);

        return new AuthResponse(newAccessToken, refreshToken, user.getUsername(), user.getAvatarUrl());
    }

    public String forgotPassword(String email) {
        if (userRepository.findByEmail(email).isEmpty()) {
            throw new RuntimeException("User with this email does not exist");
        }
        String otp = String.format("%06d", new Random().nextInt(999999));
        redisTemplate.opsForValue().set("otp:" + email, otp, 5, TimeUnit.MINUTES);
        emailService.sendOtpEmail(email, otp);
        return "OTP sent to " + email;
    }

    public String resetPassword(String email, String otp, String newPassword) {
        String savedOtp = redisTemplate.opsForValue().get("otp:" + email);
        if (savedOtp == null || !savedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        redisTemplate.delete("otp:" + email);
        return "Password successfully reset";
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserResponse getUserProfile(String username, String currentUserEmail) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isFollowing = false;
        if (currentUserEmail != null) {
            User currentUser = userRepository.findByEmail(currentUserEmail).orElse(null);
            if (currentUser != null) {
                isFollowing = followRepository.findByFollowerAndFollowing(currentUser, user).isPresent();
            }
        }

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBio(),
                user.getAvatarUrl(),
                (int) followRepository.countByFollowing(user),
                (int) followRepository.countByFollower(user),
                user.isShowActivityStatus(),
                isFollowing,
                user.isPrivateAccount(),
                isUserOnline(user.getUsername()),
                user.getCreatedAt());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserResponse getUserProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBio(),
                user.getAvatarUrl(),
                (int) followRepository.countByFollowing(user),
                (int) followRepository.countByFollower(user),
                user.isShowActivityStatus(),
                false,
                user.isPrivateAccount(),
                isUserOnline(user.getUsername()),
                user.getCreatedAt());
    }

    @org.springframework.transaction.annotation.Transactional
    public String toggleFollow(String currentUserEmail, String targetUsername) {
        User follower = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User following = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        if (follower.getId().equals(following.getId())) {
            throw new RuntimeException("You cannot follow yourself!");
        }

        Optional<Follow> existingFollow = followRepository.findByFollowerAndFollowing(follower, following);

        if (existingFollow.isPresent()) {
            followRepository.delete(existingFollow.get());
            return "Unfollowed " + targetUsername + " successfully!";
        } else {
            Follow newFollow = new Follow(follower, following);
            followRepository.save(newFollow);
            notificationService.sendNotification(following.getId(), follower.getId(), NotificationType.FOLLOW,
                    follower.getUsername() + " started following you");
            return "Followed " + targetUsername + " successfully!";
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateBio(String email, String bio) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBio(bio);
        userRepository.save(user);
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getBio(), user.getAvatarUrl(),
                (int) followRepository.countByFollowing(user), (int) followRepository.countByFollower(user), user.isShowActivityStatus(), false,
                user.isPrivateAccount(), true, user.getCreatedAt());
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateSettings(String email, Boolean pushNotifications, Boolean emailNotifications,
            Boolean isPrivateAccount) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (pushNotifications != null) {
            user.setPushNotificationsEnabled(pushNotifications);
        }
        if (emailNotifications != null) {
            user.setEmailNotificationsEnabled(emailNotifications);
        }
        if (isPrivateAccount != null) {
            user.setPrivateAccount(isPrivateAccount);
        }
        userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.Map<String, Boolean> getSettings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        java.util.Map<String, Boolean> settings = new java.util.HashMap<>();
        settings.put("pushNotifications", user.isPushNotificationsEnabled());
        settings.put("emailNotifications", user.isEmailNotificationsEnabled());
        settings.put("isPrivateAccount", user.isPrivateAccount());
        return settings;
    }


    @org.springframework.transaction.annotation.Transactional
    public UserResponse updateAvatar(String email, MultipartFile file) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String filename = fileStorageService.save(file);
        String avatarUrl = filename.startsWith("http") ? filename : (apiUrl + "/uploads/" + filename);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getBio(), user.getAvatarUrl(),
                (int) followRepository.countByFollowing(user), (int) followRepository.countByFollower(user), user.isShowActivityStatus(), false,
                user.isPrivateAccount(), true, user.getCreatedAt());
    }

    @org.springframework.transaction.annotation.Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Delete follows
        followRepository.deleteByFollower(user);
        followRepository.deleteByFollowing(user);

        // 2. Delete post likes
        postLikeRepository.deleteByUser(user);

        // 3. Delete comments
        commentRepository.deleteByAuthor(user);

        // 4. Delete posts and their relations
        List<Post> posts = postRepository.findByAuthorOrderByCreatedAtDesc(user);
        for (Post post : posts) {
            postLikeRepository.deleteByPost(post);
            commentRepository.deleteByPost(post);
            postRepository.delete(post);
        }

        // 5. Delete user
        userRepository.delete(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateActivityStatus(String email, boolean status) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setShowActivityStatus(status);
        userRepository.save(user);
    }

    public void pingUserOnline(String email) {
        try {
            userRepository.findByEmail(email).ifPresent(user -> {
                redisTemplate.opsForValue().set("online:" + user.getUsername(), "true", 45, TimeUnit.SECONDS);
            });
        } catch (Exception e) {
            // Redis might be down, ignore to keep app functional
        }
    }

    public boolean isUserOnline(String username) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey("online:" + username));
        } catch (Exception e) {
            return false; // Safely default to offline if Redis is down
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<com.social.backend.dto.RecommendationResponse> getSuggestions(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<User> allUsers = userRepository.findAll();
        List<User> currentUserFollowing = followRepository.findByFollower(currentUser).stream()
                .map(com.social.backend.entity.Follow::getFollowing)
                .toList();

        return allUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> !currentUserFollowing.contains(u))
                .map(u -> {
                    List<User> uFollowers = followRepository.findByFollowing(u).stream()
                            .map(com.social.backend.entity.Follow::getFollower)
                            .toList();

                    List<User> mutuals = uFollowers.stream()
                            .filter(currentUserFollowing::contains)
                            .toList();

                    String reason = "Suggested for you";
                    if (!mutuals.isEmpty()) {
                        if (mutuals.size() == 1) {
                            reason = "Followed by " + mutuals.get(0).getUsername();
                        } else {
                            reason = "Followed by " + mutuals.get(0).getUsername() + " + " + (mutuals.size() - 1) + " others";
                        }
                    } else if (u.getFollowersCount() >= 5) {
                        reason = "Popular";
                    }

                    return new com.social.backend.dto.RecommendationResponse(
                            u.getId(),
                            u.getUsername(),
                            u.getAvatarUrl(),
                            reason,
                            false
                    );
                })
                .sorted((r1, r2) -> {
                    boolean r1Mutual = r1.reason().startsWith("Followed by");
                    boolean r2Mutual = r2.reason().startsWith("Followed by");
                    if (r1Mutual && !r2Mutual) return -1;
                    if (!r1Mutual && r2Mutual) return 1;

                    boolean r1Popular = r1.reason().equals("Popular");
                    boolean r2Popular = r2.reason().equals("Popular");
                    if (r1Popular && !r2Popular) return -1;
                    if (!r1Popular && r2Popular) return 1;

                    return 0;
                })
                .limit(5)
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UserResponse> getFollowers(String username, String currentUserEmail) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (!targetUser.getId().equals(currentUser.getId())) {
            boolean isFollowing = followRepository.findByFollowerAndFollowing(currentUser, targetUser).isPresent();
            if (!isFollowing) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "You must follow this user to see their followers!");
            }
        }

        List<com.social.backend.entity.Follow> follows = followRepository.findByFollowing(targetUser);

        return follows.stream()
                .map(com.social.backend.entity.Follow::getFollower)
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getBio(),
                        u.getAvatarUrl(),
                        (int) followRepository.countByFollowing(u),
                        (int) followRepository.countByFollower(u),
                        u.isShowActivityStatus(),
                        false,
                        u.isPrivateAccount(),
                        isUserOnline(u.getUsername()),
                        u.getCreatedAt()))
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UserResponse> getFollowing(String username, String currentUserEmail) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (!targetUser.getId().equals(currentUser.getId())) {
            boolean isFollowing = followRepository.findByFollowerAndFollowing(currentUser, targetUser).isPresent();
            if (!isFollowing) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "You must follow this user to see their following list!");
            }
        }

        List<com.social.backend.entity.Follow> follows = followRepository.findByFollower(targetUser);

        return follows.stream()
                .map(com.social.backend.entity.Follow::getFollowing)
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getUsername(),
                        u.getEmail(),
                        u.getBio(),
                        u.getAvatarUrl(),
                        (int) followRepository.countByFollowing(u),
                        (int) followRepository.countByFollower(u),
                        u.isShowActivityStatus(),
                        false,
                        u.isPrivateAccount(),
                        isUserOnline(u.getUsername()),
                        u.getCreatedAt()))
                .toList();
    }
}
