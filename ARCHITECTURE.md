# NexPay API — Project Architecture

> Stack: Java Spring Boot · Supabase (PostgreSQL) · React + TypeScript

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17 + Spring Boot 3.x |
| Security | Spring Security + JWT |
| Database | Supabase (PostgreSQL) |
| ORM | Spring Data JPA |
| API Docs | Swagger / OpenAPI 3.0 |
| Frontend | React 18 + TypeScript |
| UI | Tailwind CSS + Shadcn/UI |
| Auth (Frontend) | Supabase Auth |
| HTTP Client | Axios + React Query |

---

## System Flow

```
React + TypeScript (Frontend)
        │
        │  REST API (HTTPS)
        ▼
Spring Boot (Backend)
   ├── JWT Auth Filter
   ├── Controllers
   ├── Services
   └── Repositories (JPA)
        │
        ▼
   Supabase (PostgreSQL)
```

---

## Folder Structure

### Backend
```
nexpay-api/
├── src/main/java/com/nexpay/api/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── JwtConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── WalletController.java
│   │   ├── PaymentController.java
│   │   └── WebhookController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── WalletService.java
│   │   ├── PaymentService.java
│   │   └── WebhookService.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── WalletRepository.java
│   │   └── TransactionRepository.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Wallet.java
│   │   └── Transaction.java
│   ├── dto/
│   │   ├── request/
│   │   └── response/
│   └── exception/
│       └── GlobalExceptionHandler.java
└── src/main/resources/
    └── application.yml
```

### Frontend
```
nexpay-dashboard/
├── src/
│   ├── api/
│   │   ├── axiosClient.ts
│   │   ├── authApi.ts
│   │   ├── walletApi.ts
│   │   └── paymentApi.ts
│   ├── components/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   └── Wallets.tsx
│   ├── store/
│   │   └── authStore.ts
│   └── types/
│       └── index.ts
```

---

## Database Schema

```
users
├── id               UUID PRIMARY KEY
├── email            VARCHAR UNIQUE NOT NULL
├── password_hash    VARCHAR
├── full_name        VARCHAR
├── role             ENUM (USER, ADMIN)
├── created_at       TIMESTAMP
└── updated_at       TIMESTAMP

wallets
├── id               UUID PRIMARY KEY
├── user_id          UUID FK → users.id
├── balance          DECIMAL(15,2) DEFAULT 0.00
├── currency         VARCHAR(3) DEFAULT 'USD'
├── status           ENUM (ACTIVE, FROZEN)
└── created_at       TIMESTAMP

transactions
├── id               UUID PRIMARY KEY
├── idempotency_key  VARCHAR UNIQUE NOT NULL
├── sender_wallet_id   UUID FK → wallets.id
├── receiver_wallet_id UUID FK → wallets.id
├── amount           DECIMAL(15,2)
├── type             ENUM (TRANSFER, DEPOSIT, WITHDRAWAL, REFUND)
├── status           ENUM (PENDING, SUCCESS, FAILED)
├── description      TEXT
└── created_at       TIMESTAMP

webhooks
├── id               UUID PRIMARY KEY
├── user_id          UUID FK → users.id
├── url              VARCHAR
├── event            VARCHAR  (e.g. payment.success)
├── is_active        BOOLEAN
└── created_at       TIMESTAMP
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/refresh` | Refresh token |

### Wallets
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/wallets` | Create wallet |
| GET | `/api/v1/wallets` | Get user wallets |
| POST | `/api/v1/wallets/{id}/deposit` | Deposit funds |
| POST | `/api/v1/wallets/{id}/withdraw` | Withdraw funds |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/payments/transfer` | Transfer funds |
| GET | `/api/v1/payments` | Transaction history |
| GET | `/api/v1/payments/{id}` | Transaction detail |
| POST | `/api/v1/payments/{id}/refund` | Refund |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/webhooks` | Register webhook |
| GET | `/api/v1/webhooks` | List webhooks |
| DELETE | `/api/v1/webhooks/{id}` | Delete webhook |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/users` | All users |
| GET | `/api/v1/admin/transactions` | All transactions |

---

## 4-Week Plan

### Week 1 — Backend Foundation
- Spring Boot project setup + Supabase connection
- Database schema (users, wallets, transactions)
- Auth: Register, Login, JWT, Refresh Token
- Spring Security config

### Week 2 — Core Payment Logic
- Wallet CRUD APIs
- Deposit & Withdrawal
- Transfer with idempotency key
- Refund flow
- Global exception handling

### Week 3 — Advanced Backend
- Webhook registration & delivery
- Role-Based Access Control (ADMIN vs USER)
- Transaction history with filters & pagination
- Swagger / OpenAPI documentation

### Week 4 — Frontend
- React + TypeScript project setup
- Login / Register pages
- Dashboard with balance & charts
- Transactions table
- Wallet management UI
- Connect all APIs

---

## Resume Description

> **NexPay API** | Spring Boot · Supabase · React TypeScript  
> Built a production-ready payment processing REST API with JWT authentication, wallet management, idempotency-safe transaction engine, webhook delivery system, and role-based access control. Developed a React TypeScript dashboard for real-time transaction monitoring. Documented with Swagger/OpenAPI 3.0.
