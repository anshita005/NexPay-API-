import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftRight, ChevronDown, CheckCircle,
  AlertCircle, Wallet, Send, Info
} from 'lucide-react'
import { walletApi } from '../api/walletApi'
import { paymentApi } from '../api/paymentApi'
import type { Transaction } from '../types'

function SuccessCard({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="card text-center py-12 space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 bg-green-900/30 border border-green-800 rounded-full flex items-center justify-center mx-auto"
      >
        <CheckCircle className="w-10 h-10 text-green-400" />
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-white">Transfer Successful!</h2>
        <p className="text-gray-400 mt-1">Your funds have been sent</p>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 text-left space-y-3 max-w-sm mx-auto">
        {[
          { label: 'Amount Sent', value: `$${tx.amount.toFixed(2)}`, color: 'text-green-400 font-bold text-lg' },
          { label: 'Status', value: tx.status },
          { label: 'Transaction ID', value: tx.id.slice(0, 18) + '...', mono: true },
          { label: 'Date', value: new Date(tx.createdAt).toLocaleString() },
        ].map(({ label, value, color, mono }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{label}</span>
            <span className={`text-sm ${color ?? 'text-white'} ${mono ? 'font-mono' : ''}`}>{value}</span>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        className="btn-primary px-10"
      >
        Make Another Transfer
      </motion.button>
    </motion.div>
  )
}

export default function Transfer() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    senderWalletId: '',
    receiverWalletId: '',
    amount: '',
    description: '',
  })
  const [result, setResult] = useState<Transaction | null>(null)
  const [error, setError] = useState('')

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletApi.getWallets().then((r) => r.data),
  })

  const selectedWallet = wallets?.find((w) => w.id === form.senderWalletId)

  const transferMutation = useMutation({
    mutationFn: () =>
      paymentApi.transfer({
        senderWalletId: form.senderWalletId,
        receiverWalletId: form.receiverWalletId,
        amount: parseFloat(form.amount),
        idempotencyKey: `transfer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: form.description || undefined,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setResult(data)
      setError('')
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Transfer failed. Please try again.')
    },
  })

  const handleReset = () => {
    setResult(null)
    setError('')
    setForm({ senderWalletId: '', receiverWalletId: '', amount: '', description: '' })
  }

  const isValid =
    form.senderWalletId &&
    form.receiverWalletId &&
    form.amount &&
    parseFloat(form.amount) > 0 &&
    form.senderWalletId !== form.receiverWalletId

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white">Transfer Funds</h1>
        <p className="text-gray-400 mt-1">Send money instantly to any wallet</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {result ? (
          <SuccessCard key="success" tx={result} onClose={handleReset} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* From Wallet */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">From</h2>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Wallet</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    value={form.senderWalletId}
                    onChange={(e) => setForm({ ...form, senderWalletId: e.target.value })}
                    className="input pl-10 appearance-none cursor-pointer"
                  >
                    <option value="">-- Choose your wallet --</option>
                    {wallets?.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.currency} Wallet — ${w.balance.toFixed(2)} ({w.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Balance preview */}
              <AnimatePresence>
                {selectedWallet && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm text-gray-400">Available balance</span>
                    <span className="text-lg font-bold text-white">${selectedWallet.balance.toFixed(2)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-brand-600/30">
                <ArrowLeftRight className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* To Wallet */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">To</h2>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Receiver Wallet ID</label>
                <input
                  type="text"
                  placeholder="Paste receiver's wallet UUID"
                  value={form.receiverWalletId}
                  onChange={(e) => setForm({ ...form, receiverWalletId: e.target.value })}
                  className="input font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Ask the receiver to share their wallet ID from the Wallets page
                </p>
              </div>
            </div>

            {/* Amount + Description */}
            <div className="card space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input pl-8 text-2xl font-bold"
                  />
                </div>
                {selectedWallet && form.amount && parseFloat(form.amount) > selectedWallet.balance && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Amount exceeds available balance
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rent payment, Sending to friend..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={isValid ? { scale: 1.02 } : {}}
              whileTap={isValid ? { scale: 0.98 } : {}}
              onClick={() => transferMutation.mutate()}
              disabled={!isValid || transferMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base"
            >
              {transferMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send {form.amount ? `$${parseFloat(form.amount).toFixed(2)}` : 'Funds'}
                </>
              )}
            </motion.button>

            {form.senderWalletId === form.receiverWalletId && form.receiverWalletId && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-yellow-400 text-sm"
              >
                Sender and receiver wallet cannot be the same
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
