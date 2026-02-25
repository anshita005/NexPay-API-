package com.nexpay.api.repository;

import com.nexpay.api.model.Transaction;
import com.nexpay.api.model.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    // ORDER BY removed — sort is handled by the Pageable passed from the controller
    @Query("SELECT t FROM Transaction t WHERE t.senderWallet IN :wallets OR t.receiverWallet IN :wallets")
    Page<Transaction> findByWallets(@Param("wallets") List<Wallet> wallets, Pageable pageable);
}
