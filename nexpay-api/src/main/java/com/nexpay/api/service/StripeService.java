package com.nexpay.api.service;

import com.nexpay.api.dto.response.StripePaymentIntentResponse;
import com.nexpay.api.dto.response.TransactionDto;
import com.nexpay.api.exception.DuplicateResourceException;
import com.nexpay.api.exception.ResourceNotFoundException;
import com.nexpay.api.model.StripePaymentIntent;
import com.nexpay.api.model.Transaction;
import com.nexpay.api.model.User;
import com.nexpay.api.model.Wallet;
import com.nexpay.api.repository.StripePaymentIntentRepository;
import com.nexpay.api.repository.TransactionRepository;
import com.nexpay.api.repository.WalletRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StripeService {

    private final StripePaymentIntentRepository stripeRepo;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.publishable-key}")
    private String publishableKey;

    @Transactional
    public StripePaymentIntentResponse createPaymentIntent(UUID walletId, BigDecimal amount, User user)
            throws StripeException {

        Stripe.apiKey = secretKey;

        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + walletId));

        // Stripe requires amount in smallest currency unit (cents for USD)
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        StripePaymentIntent entity = StripePaymentIntent.builder()
                .stripePaymentIntentId(intent.getId())
                .wallet(wallet)
                .user(user)
                .amount(amount)
                .currency("usd")
                .status("PENDING")
                .build();

        stripeRepo.save(entity);

        return new StripePaymentIntentResponse(
                intent.getClientSecret(),
                intent.getId(),
                amount,
                "usd",
                publishableKey
        );
    }

    @Transactional
    public TransactionDto confirmPayment(String paymentIntentId, User user) throws StripeException {
        Stripe.apiKey = secretKey;

        // Verify with Stripe that payment actually succeeded
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        if (!"succeeded".equals(intent.getStatus())) {
            throw new RuntimeException("Payment not successful. Stripe status: " + intent.getStatus());
        }

        StripePaymentIntent entity = stripeRepo.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment intent not found: " + paymentIntentId));

        // Idempotency — prevent double-crediting
        if ("COMPLETED".equals(entity.getStatus())) {
            throw new DuplicateResourceException("Payment already processed");
        }

        entity.setStatus("COMPLETED");
        stripeRepo.save(entity);

        Wallet wallet = walletRepository.findByIdWithLock(entity.getWallet().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(entity.getAmount()));

        Transaction tx = Transaction.builder()
                .idempotencyKey(paymentIntentId)
                .receiverWallet(wallet)
                .amount(entity.getAmount())
                .type(Transaction.Type.DEPOSIT)
                .status(Transaction.Status.SUCCESS)
                .description("Card payment via Stripe")
                .build();

        transactionRepository.save(tx);
        return TransactionDto.from(tx);
    }
}
