import axiosClient from './axiosClient'
import type { Transaction, PageResponse } from '../types'

export const paymentApi = {
  transfer: (data: {
    senderWalletId: string
    receiverWalletId: string
    amount: number
    idempotencyKey: string
    description?: string
  }) => axiosClient.post<Transaction>('/api/v1/payments/transfer', data),

  getHistory: (page = 0, size = 20) =>
    axiosClient.get<PageResponse<Transaction>>(`/api/v1/payments?page=${page}&size=${size}`),

  getById: (id: string) =>
    axiosClient.get<Transaction>(`/api/v1/payments/${id}`),

  refund: (id: string) =>
    axiosClient.post<Transaction>(`/api/v1/payments/${id}/refund`),
}
