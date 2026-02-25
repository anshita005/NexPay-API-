package com.nexpay.api.controller;

import com.nexpay.api.dto.request.TransferRequest;
import com.nexpay.api.dto.response.TransactionDto;
import com.nexpay.api.model.User;
import com.nexpay.api.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Auth")
@Tag(name = "Payments", description = "Transfer, history, and refund endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/transfer")
    @Operation(summary = "Transfer funds between wallets (idempotent)")
    public ResponseEntity<TransactionDto> transfer(
            @Valid @RequestBody TransferRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(paymentService.transfer(request, user));
    }

    @GetMapping
    @Operation(summary = "Get transaction history for the current user")
    public ResponseEntity<Page<TransactionDto>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User user) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(paymentService.getTransactionHistory(user, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific transaction by ID")
    public ResponseEntity<TransactionDto> getById(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(paymentService.getTransactionById(id, user));
    }

    @PostMapping("/{id}/refund")
    @Operation(summary = "Refund a successful transfer")
    public ResponseEntity<TransactionDto> refund(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(paymentService.refund(id, user));
    }
}
