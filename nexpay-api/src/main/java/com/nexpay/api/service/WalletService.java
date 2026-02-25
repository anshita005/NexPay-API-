package com.nexpay.api.service;

import com.nexpay.api.dto.request.AmountRequest;
import com.nexpay.api.dto.response.TransactionDto;
import com.nexpay.api.dto.response.WalletDto;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public WalletDto createWallet(User user) {
        Wallet wallet = Wallet.builder()
                .user(user)
                .build();
        return WalletDto.from(walletRepository.save(wallet));
    }

    public List<WalletDto> getUserWallets(User user) {
        return walletRepository.findByUser(user)
                .stream()
                .map(WalletDto::from)
                .toList();
    }

    @Transactional
    public TransactionDto deposit(UUID walletId, AmountRequest request, User user) {
        Wallet wallet = walletRepository.findByIdWithLock(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));

        if (!wallet.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("This wallet does not belong to you");
        }
        if (wallet.getStatus() == Wallet.Status.FROZEN) {
            throw new WalletFrozenException("Wallet is frozen. Cannot deposit.");
        }

        wallet.setBalance(wallet.getBalance().add(request.amount()));

        Transaction tx = Transaction.builder()
                .idempotencyKey(UUID.randomUUID().toString())
                .receiverWallet(wallet)
                .amount(request.amount())
                .type(Transaction.Type.DEPOSIT)
                .status(Transaction.Status.SUCCESS)
                .description(request.description() != null ? request.description() : "Deposit")
                .build();

        transactionRepository.save(tx);
        return TransactionDto.from(tx);
    }

    @Transactional
    public TransactionDto withdraw(UUID walletId, AmountRequest request, User user) {
        Wallet wallet = walletRepository.findByIdWithLock(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));

        if (!wallet.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("This wallet does not belong to you");
        }
        if (wallet.getStatus() == Wallet.Status.FROZEN) {
            throw new WalletFrozenException("Wallet is frozen. Cannot withdraw.");
        }
        if (wallet.getBalance().compareTo(request.amount()) < 0) {
            throw new InsufficientFundsException("Insufficient balance. Available: " + wallet.getBalance());
        }

        wallet.setBalance(wallet.getBalance().subtract(request.amount()));

        Transaction tx = Transaction.builder()
                .idempotencyKey(UUID.randomUUID().toString())
                .senderWallet(wallet)
                .amount(request.amount())
                .type(Transaction.Type.WITHDRAWAL)
                .status(Transaction.Status.SUCCESS)
                .description(request.description() != null ? request.description() : "Withdrawal")
                .build();

        transactionRepository.save(tx);
        return TransactionDto.from(tx);
    }
}
