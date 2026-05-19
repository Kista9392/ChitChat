package com.social.backend.repository;

import com.social.backend.entity.User;
import com.social.backend.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // 🪄 Magic Method 1! 
    // Spring Boot automatically translates this to:
    // SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // 🪄 Magic Method 2!
    // SELECT * FROM users WHERE username = ?
    Optional<User> findByUsername(String username);

    Optional<User> findByPhoneNumber(String phoneNumber);

    java.util.List<User> findByUsernameContainingIgnoreCase(String username);

    java.util.List<User> findByRole(Role role);
}
