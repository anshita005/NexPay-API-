import axiosClient from './axiosClient'
import type { Wallet, Transaction } from '../types'

export const walletApi = {
  getWallets: () =>
    axiosClient.get<Wallet[]>('/api/v1/wallets'),

  createWallet: () =>
    axiosClient.post<Wallet>('/api/v1/wallets'),

  deposit: (id: string, amount: number, description?: string) =>
    axiosClient.post<Transaction>(`/api/v1/wallets/${id}/deposit`, { amount, description }),

  withdraw: (id: string, amount: number, description?: string) =>
    axiosClient.post<Transaction>(`/api/v1/wallets/${id}/withdraw`, { amount, description }),
}
