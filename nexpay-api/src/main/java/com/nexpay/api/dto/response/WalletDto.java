package com.nexpay.api.dto.response;

import com.nexpay.api.model.Wallet;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record WalletDto(
        UUID id,
        UUID userId,
        BigDecimal balance,
        String currency,
        String status,
        LocalDateTime createdAt
) {
    public static WalletDto from(Wallet wallet) {
        return new WalletDto(
                wallet.getId(),
                wallet.getUser().getId(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getStatus().name(),
                wallet.getCreatedAt()
        );
    }
}
