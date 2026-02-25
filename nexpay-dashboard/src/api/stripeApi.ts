import axiosClient from './axiosClient'

export const stripeApi = {
  createPaymentIntent: (walletId: string, amount: number) =>
    axiosClient.post('/api/v1/stripe/create-intent', { walletId, amount }),

  confirmPayment: (paymentIntentId: string) =>
    axiosClient.post('/api/v1/stripe/confirm', { paymentIntentId }),
}
