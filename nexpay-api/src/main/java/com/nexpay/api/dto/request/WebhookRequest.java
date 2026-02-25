package com.nexpay.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record WebhookRequest(
        @NotBlank(message = "URL is required")
        @URL(message = "Must be a valid URL")
        String url,

        @NotBlank(message = "Event is required")
        String event
) {}
