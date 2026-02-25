package com.nexpay.api.repository;

import com.nexpay.api.model.StripePaymentIntent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StripePaymentIntentRepository extends JpaRepository<StripePaymentIntent, UUID> {
    Optional<StripePaymentIntent> findByStripePaymentIntentId(String stripePaymentIntentId);
}
