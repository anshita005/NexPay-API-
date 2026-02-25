import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripeApi } from '../api/stripeApi'
import { useQueryClient } from '@tanstack/react-query'
import type { Stripe as StripeType } from '@stripe/stripe-js'

// ── Inner form rendered inside <Elements> ───────────────────────────────────

function CardForm({
  clientSecret,
  paymentIntentId,
  amount,
  onSuccess,
  onError,
}: {
  clientSecret: string
  paymentIntentId: string
  amount: number
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setPaying(true)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      onError(submitError.message ?? 'Card validation failed')
      setPaying(false)
      return
    }

    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message ?? 'Payment failed')
      setPaying(false)
      return
    }

    // Payment succeeded — tell backend to credit the wallet
    try {
      await stripeApi.confirmPayment(paymentIntentId)
      onSuccess()
    } catch {
      onError('Payment charged but wallet credit failed. Contact support.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Card Details</p>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/30 rounded-xl px-4 py-3">
        <span>Total charge</span>
        <span className="text-white font-bold text-lg">${amount.toFixed(2)} USD</span>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePay}
        disabled={paying || !stripe}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {paying ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
          />
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </motion.button>

      <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
        🔒 Secured by Stripe — test card: 4242 4242 4242 4242
      </p>
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

export default function StripeCheckoutModal({
  walletId,
  onClose,
}: {
  walletId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const [step, setStep] = useState<'amount' | 'card' | 'success'>('amount')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [clientSecret, setClientSecret] = useState('')
  const [paymentIntentId, setPaymentIntentId] = useState('')
  const [stripePromise, setStripePromise] = useState<Promise<StripeType | null> | null>(null)

  const handleContinue = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 0.5) {
      setError('Minimum amount is $0.50')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await stripeApi.createPaymentIntent(walletId, amt)
      const { clientSecret: cs, paymentIntentId: piId, publishableKey } = res.data
      setClientSecret(cs)
      setPaymentIntentId(piId)
      setStripePromise(loadStripe(publishableKey))
      setStep('card')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to initialise payment')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    setStep('success')
    queryClient.invalidateQueries({ queryKey: ['wallets'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    setTimeout(onClose, 2500)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="card w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {step === 'success' ? 'Payment Successful' : 'Fund Wallet'}
                </h3>
                <p className="text-xs text-gray-500">
                  {step === 'amount' && 'Enter amount to add'}
                  {step === 'card' && `Charging $${parseFloat(amount).toFixed(2)}`}
                  {step === 'success' && 'Wallet credited'}
                </p>
              </div>
            </div>
            {step !== 'success' && (
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Step: amount */}
          {step === 'amount' && (
            <div className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  min="0.50"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input text-2xl font-bold"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Minimum $0.50 · Test card: 4242 4242 4242 4242</p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  disabled={loading || !amount}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Continue'}
                </motion.button>
              </div>
            </div>
          )}

          {/* Step: card */}
          {step === 'card' && stripePromise && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#7c3aed',
                    colorBackground: '#1f2937',
                    colorText: '#f9fafb',
                    colorDanger: '#ef4444',
                    borderRadius: '10px',
                    fontSizeBase: '14px',
                  },
                },
              }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm mb-4"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
              <CardForm
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                amount={parseFloat(amount)}
                onSuccess={handleSuccess}
                onError={(msg) => setError(msg)}
              />
            </Elements>
          )}

          {/* Step: success */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center border-2 border-green-600"
              >
                <CheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>
              <p className="text-white font-bold text-xl">${parseFloat(amount).toFixed(2)} Added!</p>
              <p className="text-gray-400 text-sm">Your wallet has been credited successfully.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
