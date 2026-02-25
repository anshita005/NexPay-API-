package com.nexpay.api.dto.response;

import com.nexpay.api.model.Transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionDto(
        UUID id,
        String idempotencyKey,
        UUID senderWalletId,
        UUID receiverWalletId,
        BigDecimal amount,
        String type,
        String status,
        String description,
        LocalDateTime createdAt
) {
    public static TransactionDto from(Transaction tx) {
        return new TransactionDto(
                tx.getId(),
                tx.getIdempotencyKey(),
                tx.getSenderWallet() != null ? tx.getSenderWallet().getId() : null,
                tx.getReceiverWallet() != null ? tx.getReceiverWallet().getId() : null,
                tx.getAmount(),
                tx.getType().name(),
                tx.getStatus().name(),
                tx.getDescription(),
                tx.getCreatedAt()
        );
    }
}
