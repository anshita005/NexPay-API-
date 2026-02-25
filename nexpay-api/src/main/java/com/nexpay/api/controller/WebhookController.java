package com.nexpay.api.controller;

import com.nexpay.api.dto.request.WebhookRequest;
import com.nexpay.api.dto.response.WebhookDto;
import com.nexpay.api.model.User;
import com.nexpay.api.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Auth")
@Tag(name = "Webhooks", description = "Webhook management endpoints")
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping
    @Operation(summary = "Register a new webhook")
    public ResponseEntity<WebhookDto> register(
            @Valid @RequestBody WebhookRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(webhookService.register(request, user));
    }

    @GetMapping
    @Operation(summary = "List all webhooks for the current user")
    public ResponseEntity<List<WebhookDto>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(webhookService.listWebhooks(user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a webhook")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        webhookService.deleteWebhook(id, user);
        return ResponseEntity.noContent().build();
    }
}
