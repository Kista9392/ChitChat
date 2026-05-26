package com.social.backend.repository;

import com.social.backend.entity.Message;
import com.social.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    
    @Query("SELECT m FROM Message m WHERE " +
           "((m.sender = :userA AND m.receiver = :userB AND (m.deletedBySender IS NULL OR m.deletedBySender = false)) OR " +
           " (m.sender = :userB AND m.receiver = :userA AND (m.deletedByReceiver IS NULL OR m.deletedByReceiver = false))) " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findConversation(@Param("userA") User userA, @Param("userB") User userB, Pageable pageable);

    java.util.List<Message> findBySenderAndReceiverAndReadAtIsNull(User sender, User receiver);

    long countByReceiverAndReadAtIsNull(User receiver);

    @Query("SELECT DISTINCT m.receiver FROM Message m WHERE m.sender = :user AND (m.deletedBySender IS NULL OR m.deletedBySender = false)")
    java.util.List<User> findReceivers(@Param("user") User user);

    @Query("SELECT DISTINCT m.sender FROM Message m WHERE m.receiver = :user AND (m.deletedByReceiver IS NULL OR m.deletedByReceiver = false)")
    java.util.List<User> findSenders(@Param("user") User user);

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :userA AND m.receiver = :userB) OR " +
           "(m.sender = :userB AND m.receiver = :userA)")
    java.util.List<Message> findAllMessagesBetweenUsers(@Param("userA") User userA, @Param("userB") User userB);

    void deleteBySender(User sender);
    void deleteByReceiver(User receiver);
}
