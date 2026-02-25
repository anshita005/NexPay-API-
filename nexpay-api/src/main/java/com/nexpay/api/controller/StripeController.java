package com.nexpay.api.controller;

import com.nexpay.api.dto.request.StripeConfirmRequest;
import com.nexpay.api.dto.request.StripePaymentIntentRequest;
import com.nexpay.api.dto.response.StripePaymentIntentResponse;
import com.nexpay.api.dto.response.TransactionDto;
import com.nexpay.api.model.User;
import com.nexpay.api.service.StripeService;
import com.stripe.exception.StripeException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stripe")
@RequiredArgsConstructor
@Tag(name = "Stripe Payments", description = "Card payment via Stripe")
public class StripeController {

    private final StripeService stripeService;

    @PostMapping("/create-intent")
    @Operation(summary = "Create a Stripe PaymentIntent")
    public ResponseEntity<StripePaymentIntentResponse> createIntent(
            @Valid @RequestBody StripePaymentIntentRequest request,
            @AuthenticationPrincipal User user
    ) throws StripeException {
        return ResponseEntity.ok(
                stripeService.createPaymentIntent(request.walletId(), request.amount(), user)
        );
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm payment and credit wallet")
    public ResponseEntity<TransactionDto> confirm(
            @Valid @RequestBody StripeConfirmRequest request,
            @AuthenticationPrincipal User user
    ) throws StripeException {
        return ResponseEntity.ok(stripeService.confirmPayment(request.paymentIntentId(), user));
    }
}
