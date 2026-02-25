package com.nexpay.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record StripePaymentIntentRequest(
        @NotNull UUID walletId,
        @NotNull @DecimalMin("0.50") BigDecimal amount
) {}
