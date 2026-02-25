package com.nexpay.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record StripeConfirmRequest(
        @NotBlank String paymentIntentId
) {}
