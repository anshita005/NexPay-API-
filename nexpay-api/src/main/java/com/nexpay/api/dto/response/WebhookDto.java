package com.nexpay.api.dto.response;

import com.nexpay.api.model.Webhook;

import java.time.LocalDateTime;
import java.util.UUID;

public record WebhookDto(
        UUID id,
        String url,
        String event,
        Boolean isActive,
        LocalDateTime createdAt
) {
    public static WebhookDto from(Webhook webhook) {
        return new WebhookDto(
                webhook.getId(),
                webhook.getUrl(),
                webhook.getEvent(),
                webhook.getIsActive(),
                webhook.getCreatedAt()
        );
    }
}
