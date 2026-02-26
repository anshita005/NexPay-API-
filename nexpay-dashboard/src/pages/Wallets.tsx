import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wallet, ArrowDownLeft, ArrowUpRight, X, CheckCircle, Copy, Check, CreditCard } from 'lucide-react'
import { walletApi } from '../api/walletApi'
import StripeCheckoutModal from '../components/StripeCheckoutModal'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.9 }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        copied
          ? 'bg-green-900/40 text-green-400 border border-green-800/50'
          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white hover:border-gray-600'
      }`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Copied!
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" /> Copy ID
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function WalletCard({ wallet, onDeposit, onWithdraw, onFundWithCard }: any) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent pointer-events-none rounded-2xl" />

      <div className="flex items-start justify-between mb-6">
        <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-brand-400" />
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          wallet.status === 'ACTIVE'
            ? 'bg-green-900/40 text-green-400 border border-green-800'
            : 'bg-red-900/40 text-red-400 border border-red-800'
        }`}>
          {wallet.status}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-1">{wallet.currency} Balance</p>
      <p className="text-2xl sm:text-4xl font-bold text-white mb-3">${wallet.balance.toFixed(2)}</p>

      {/* Wallet ID row with copy button */}
      <div className="flex items-center justify-between mb-6 bg-gray-800/50 rounded-xl px-3 py-2">
        <p className="text-xs text-gray-500 font-mono truncate flex-1 mr-2">{wallet.id}</p>
        <CopyButton text={wallet.id} />
      </div>

      <div className="flex gap-3 mb-3">
        <button
          onClick={() => onDeposit(wallet.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/50 transition-all text-sm font-medium"
        >
          <ArrowDownLeft className="w-4 h-4" /> Deposit
        </button>
        <button
          onClick={() => onWithdraw(wallet.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition-all text-sm font-medium"
        >
          <ArrowUpRight className="w-4 h-4" /> Withdraw
        </button>
      </div>
      <button
        onClick={() => onFundWithCard(wallet.id)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-600/40 hover:bg-brand-600/30 transition-all text-sm font-medium"
      >
        <CreditCard className="w-4 h-4" /> Fund with Card (Stripe)
      </button>
    </motion.div>
  )
}

function AmountModal({ open, title, onClose, onConfirm, loading }: any) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="card w-full max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount (USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input text-2xl font-bold"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description (optional)</label>
              <input
                type="text"
                placeholder="Add a note..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => onConfirm(parseFloat(amount), description)}
              disabled={!amount || parseFloat(amount) <= 0 || loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : 'Confirm'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Wallets() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<{ type: 'deposit' | 'withdraw'; walletId: string } | null>(null)
  const [stripeWalletId, setStripeWalletId] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletApi.getWallets().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => walletApi.createWallet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setSuccess('Wallet created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const depositMutation = useMutation({
    mutationFn: ({ id, amount, desc }: any) => walletApi.deposit(id, amount, desc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setModal(null)
      setSuccess('Deposit successful!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: ({ id, amount, desc }: any) => walletApi.withdraw(id, amount, desc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setModal(null)
      setSuccess('Withdrawal successful!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const handleConfirm = (amount: number, description: string) => {
    if (!modal) return
    if (modal.type === 'deposit') {
      depositMutation.mutate({ id: modal.walletId, amount, desc: description })
    } else {
      withdrawMutation.mutate({ id: modal.walletId, amount, desc: description })
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Wallets</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage your payment wallets</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="btn-primary flex items-center gap-2 shrink-0 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">New Wallet</span>
          <span className="sm:hidden">New</span>
        </motion.button>
      </motion.div>

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-xl text-sm"
          >
            <CheckCircle className="w-4 h-4" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-12 w-12 bg-gray-800 rounded-xl mb-6" />
              <div className="h-4 bg-gray-800 rounded mb-3 w-24" />
              <div className="h-8 bg-gray-800 rounded mb-4 w-36" />
              <div className="h-10 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : wallets?.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 mb-2">No wallets yet</p>
          <p className="text-gray-500 text-sm">Click "New Wallet" to create your first wallet</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets?.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onDeposit={(id: string) => setModal({ type: 'deposit', walletId: id })}
              onWithdraw={(id: string) => setModal({ type: 'withdraw', walletId: id })}
              onFundWithCard={(id: string) => setStripeWalletId(id)}
            />
          ))}
        </div>
      )}

      {stripeWalletId && (
        <StripeCheckoutModal
          walletId={stripeWalletId}
          onClose={() => setStripeWalletId(null)}
        />
      )}

      <AmountModal
        open={!!modal}
        title={modal?.type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
        onClose={() => setModal(null)}
        onConfirm={handleConfirm}
        loading={depositMutation.isPending || withdrawMutation.isPending}
      />
    </div>
  )
}
