package com.nexpay.api.service;

import com.nexpay.api.dto.request.WebhookRequest;
import com.nexpay.api.dto.response.WebhookDto;
import com.nexpay.api.exception.ResourceNotFoundException;
import com.nexpay.api.exception.UnauthorizedException;
import com.nexpay.api.model.User;
import com.nexpay.api.model.Webhook;
import com.nexpay.api.repository.WebhookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final WebhookRepository webhookRepository;
    private final RestTemplate restTemplate;

    @Transactional
    public WebhookDto register(WebhookRequest request, User user) {
        Webhook webhook = Webhook.builder()
                .user(user)
                .url(request.url())
                .event(request.event())
                .build();
        return WebhookDto.from(webhookRepository.save(webhook));
    }

    public List<WebhookDto> listWebhooks(User user) {
        return webhookRepository.findByUser(user)
                .stream()
                .map(WebhookDto::from)
                .toList();
    }

    @Transactional
    public void deleteWebhook(UUID id, User user) {
        Webhook webhook = webhookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found: " + id));

        if (!webhook.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("This webhook does not belong to you");
        }

        webhookRepository.delete(webhook);
    }

    @Async
    public void fireWebhooks(String event, Object payload) {
        List<Webhook> webhooks = webhookRepository.findByEventAndIsActiveTrue(event);
        webhooks.forEach(webhook -> {
            try {
                restTemplate.postForEntity(webhook.getUrl(), payload, String.class);
                log.info("Webhook delivered to {} for event {}", webhook.getUrl(), event);
            } catch (Exception e) {
                log.warn("Webhook delivery failed to {} for event {}: {}", webhook.getUrl(), event, e.getMessage());
            }
        });
    }
}
