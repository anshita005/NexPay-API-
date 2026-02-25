package com.nexpay.api.repository;

import com.nexpay.api.model.User;
import com.nexpay.api.model.Webhook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, UUID> {
    List<Webhook> findByUser(User user);
    List<Webhook> findByEventAndIsActiveTrue(String event);
}
