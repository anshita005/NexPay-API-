package com.nexpay.api.service;

import com.nexpay.api.dto.request.TransferRequest;
import com.nexpay.api.dto.response.TransactionDto;
import com.nexpay.api.exception.InsufficientFundsException;
import com.nexpay.api.exception.ResourceNotFoundException;
import com.nexpay.api.exception.UnauthorizedException;
import com.nexpay.api.exception.WalletFrozenException;
import com.nexpay.api.model.Transaction;
import com.nexpay.api.model.User;
import com.nexpay.api.model.Wallet;
import com.nexpay.api.repository.TransactionRepository;
import com.nexpay.api.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final WebhookService webhookService;

    @Transactional
    public TransactionDto transfer(TransferRequest request, User user) {
        // Idempotency check — same key returns the same result
        return transactionRepository.findByIdempotencyKey(request.idempotencyKey())
                .map(TransactionDto::from)
                .orElseGet(() -> executeTransfer(request, user));
    }

    private TransactionDto executeTransfer(TransferRequest request, User user) {
        Wallet sender = walletRepository.findByIdWithLock(request.senderWalletId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender wallet not found"));

        Wallet receiver = walletRepository.findByIdWithLock(request.receiverWalletId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver wallet not found"));

        if (!sender.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Sender wallet does not belong to you");
        }
        if (sender.getStatus() == Wallet.Status.FROZEN) {
            throw new WalletFrozenException("Sender wallet is frozen");
        }
        if (receiver.getStatus() == Wallet.Status.FROZEN) {
            throw new WalletFrozenException("Receiver wallet is frozen");
        }
        if (sender.getBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientFundsException("Insufficient balance. Available: " + sender.getBalance());
        }

        sender.setBalance(sender.getBalance().subtract(request.amount()));
        receiver.setBalance(receiver.getBalance().add(request.amount()));

        walletRepository.save(sender);
        walletRepository.save(receiver);

        Transaction tx = Transaction.builder()
                .idempotencyKey(request.idempotencyKey())
                .senderWallet(sender)
                .receiverWallet(receiver)
                .amount(request.amount())
                .type(Transaction.Type.TRANSFER)
                .status(Transaction.Status.SUCCESS)
                .description(request.description())
                .build();

        Transaction saved = transactionRepository.save(tx);

        // Fire webhook async — does not block the response
        webhookService.fireWebhooks("payment.success", TransactionDto.from(saved));

        return TransactionDto.from(saved);
    }

    @Transactional
    public TransactionDto refund(UUID transactionId, User user) {
        Transaction original = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        if (original.getType() != Transaction.Type.TRANSFER) {
            throw new IllegalArgumentException("Only TRANSFER transactions can be refunded");
        }
        if (original.getStatus() != Transaction.Status.SUCCESS) {
            throw new IllegalArgumentException("Only successful transactions can be refunded");
        }
        if (!original.getSenderWallet().getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only refund your own transactions");
        }

        // Reverse the money flow
        Wallet originalSender = walletRepository.findByIdWithLock(original.getSenderWallet().getId()).orElseThrow();
        Wallet originalReceiver = walletRepository.findByIdWithLock(original.getReceiverWallet().getId()).orElseThrow();

        if (originalReceiver.getBalance().compareTo(original.getAmount()) < 0) {
            throw new InsufficientFundsException("Receiver has insufficient balance for refund");
        }

        originalReceiver.setBalance(originalReceiver.getBalance().subtract(original.getAmount()));
        originalSender.setBalance(originalSender.getBalance().add(original.getAmount()));

        walletRepository.save(originalSender);
        walletRepository.save(originalReceiver);

        Transaction refundTx = Transaction.builder()
                .idempotencyKey("refund-" + original.getId())
                .senderWallet(originalReceiver)
                .receiverWallet(originalSender)
                .amount(original.getAmount())
                .type(Transaction.Type.REFUND)
                .status(Transaction.Status.SUCCESS)
                .description("Refund for transaction: " + original.getId())
                .build();

        return TransactionDto.from(transactionRepository.save(refundTx));
    }

    public Page<TransactionDto> getTransactionHistory(User user, Pageable pageable) {
        List<Wallet> userWallets = walletRepository.findByUser(user);
        if (userWallets.isEmpty()) {
            return Page.empty(pageable);
        }
        return transactionRepository.findByWallets(userWallets, pageable)
                .map(TransactionDto::from);
    }

    public TransactionDto getTransactionById(UUID id, User user) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        List<Wallet> userWallets = walletRepository.findByUser(user);
        boolean belongsToUser = userWallets.stream().anyMatch(w ->
                (tx.getSenderWallet() != null && tx.getSenderWallet().getId().equals(w.getId())) ||
                (tx.getReceiverWallet() != null && tx.getReceiverWallet().getId().equals(w.getId()))
        );

        if (!belongsToUser) {
            throw new UnauthorizedException("Transaction does not belong to you");
        }

        return TransactionDto.from(tx);
    }
}
