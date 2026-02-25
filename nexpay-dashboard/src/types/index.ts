export interface User {
  id: string
  email: string
  fullName: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  user: User
}

export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  status: 'ACTIVE' | 'FROZEN'
  createdAt: string
}

export interface Transaction {
  id: string
  idempotencyKey: string
  senderWalletId: string | null
  receiverWalletId: string | null
  amount: number
  type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND'
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  description: string | null
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ErrorResponse {
  code: string
  message: string
  timestamp: string
}
