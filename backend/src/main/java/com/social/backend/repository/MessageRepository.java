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
    
    // Logic: Fetch conversation between User A and User B, ordered by oldest first
    // This custom @Query handles both sides of the conversation (sent and received)
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :userA AND m.receiver = :userB) OR " +
           "(m.sender = :userB AND m.receiver = :userA) " +
           "ORDER BY m.createdAt ASC")
    Page<Message> findConversation(@Param("userA") User userA, @Param("userB") User userB, Pageable pageable);

    java.util.List<Message> findBySenderAndReceiverAndReadAtIsNull(User sender, User receiver);
}
