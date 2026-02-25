package com.nexpay.api.controller;

import com.nexpay.api.dto.request.AmountRequest;
import com.nexpay.api.dto.response.TransactionDto;
import com.nexpay.api.dto.response.WalletDto;
import com.nexpay.api.model.User;
import com.nexpay.api.service.WalletService;
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
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Auth")
@Tag(name = "Wallets", description = "Wallet management endpoints")
public class WalletController {

    private final WalletService walletService;

    @PostMapping
    @Operation(summary = "Create a new wallet")
    public ResponseEntity<WalletDto> createWallet(@AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(walletService.createWallet(user));
    }

    @GetMapping
    @Operation(summary = "Get all wallets for the current user")
    public ResponseEntity<List<WalletDto>> getWallets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.getUserWallets(user));
    }

    @PostMapping("/{id}/deposit")
    @Operation(summary = "Deposit funds into a wallet")
    public ResponseEntity<TransactionDto> deposit(
            @PathVariable UUID id,
            @Valid @RequestBody AmountRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.deposit(id, request, user));
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw funds from a wallet")
    public ResponseEntity<TransactionDto> withdraw(
            @PathVariable UUID id,
            @Valid @RequestBody AmountRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.withdraw(id, request, user));
    }
}
