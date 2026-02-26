import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  RotateCcw, ChevronLeft, ChevronRight, Search,
  CornerUpLeft, X, AlertCircle, CheckCircle
} from 'lucide-react'
import { paymentApi } from '../api/paymentApi'
import type { Transaction } from '../types'

function typeBadge(type: string) {
  const map: Record<string, string> = {
    DEPOSIT:    'bg-green-900/40 text-green-400 border-green-800',
    WITHDRAWAL: 'bg-red-900/40 text-red-400 border-red-800',
    TRANSFER:   'bg-blue-900/40 text-blue-400 border-blue-800',
    REFUND:     'bg-purple-900/40 text-purple-400 border-purple-800',
  }
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[type] ?? ''}`
}

function statusBadge(status: string) {
  if (status === 'SUCCESS') return 'badge-success'
  if (status === 'PENDING') return 'badge-pending'
  return 'badge-failed'
}

function typeIcon(type: string) {
  if (type === 'DEPOSIT' || type === 'REFUND') return <ArrowDownLeft className="w-4 h-4 text-green-400" />
  if (type === 'WITHDRAWAL') return <ArrowUpRight className="w-4 h-4 text-red-400" />
  return <ArrowLeftRight className="w-4 h-4 text-blue-400" />
}

function amountColor(type: string) {
  if (type === 'DEPOSIT' || type === 'REFUND') return 'text-green-400'
  if (type === 'WITHDRAWAL') return 'text-red-400'
  return 'text-blue-400'
}

function RefundModal({ tx, onClose, onConfirm, loading }: {
  tx: Transaction; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
  return (
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
          <h3 className="text-lg font-semibold text-white">Confirm Refund</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 space-y-3 mb-6">
          {[
            { label: 'Amount', value: `$${tx.amount.toFixed(2)}`, color: 'text-white font-semibold' },
            { label: 'Description', value: tx.description || '—' },
            { label: 'Original Date', value: new Date(tx.createdAt).toLocaleString() },
            { label: 'Transaction ID', value: tx.id.slice(0, 16) + '...', mono: true },
          ].map(({ label, value, color, mono }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className={`text-sm ${color ?? 'text-gray-300'} ${mono ? 'font-mono' : ''}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-3 mb-6">
          <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400">
            This will reverse the transfer. The amount will be returned to your wallet.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold transition-all text-sm disabled:opacity-50"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <><CornerUpLeft className="w-4 h-4" /> Refund</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Transactions() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [refundTx, setRefundTx] = useState<Transaction | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => paymentApi.getHistory(page, 15).then((r) => r.data),
  })

  const refundMutation = useMutation({
    mutationFn: (id: string) => paymentApi.refund(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      setRefundTx(null)
      setToast({ type: 'success', message: 'Refund processed successfully! Funds returned to your wallet.' })
      setTimeout(() => setToast(null), 4000)
    },
    onError: (err: any) => {
      setRefundTx(null)
      setToast({ type: 'error', message: err.response?.data?.message || 'Refund failed. Please try again.' })
      setTimeout(() => setToast(null), 4000)
    },
  })

  const transactions = data?.content ?? []
  const filtered = transactions.filter((t: Transaction) =>
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase()) ||
    t.amount.toString().includes(search)
  )

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Your complete payment history</p>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
              toast.type === 'success'
                ? 'bg-green-900/30 border-green-800 text-green-400'
                : 'bg-red-900/30 border-red-800 text-red-400'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Filter by type, status or amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-11"
        />
      </motion.div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-gray-800 rounded w-24" />
              <div className="h-6 bg-gray-800 rounded w-32" />
              <div className="h-3 bg-gray-800 rounded w-40" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <RotateCcw className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          filtered.map((tx: Transaction, i: number) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {typeIcon(tx.type)}
                  <span className={typeBadge(tx.type)}>{tx.type}</span>
                </div>
                <span className={statusBadge(tx.status)}>{tx.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${amountColor(tx.type)}`}>
                  {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                  ${tx.amount.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </span>
              </div>
              {tx.description && (
                <p className="text-gray-400 text-sm truncate">{tx.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gray-600">{tx.id.slice(0, 16)}...</span>
                {tx.type === 'TRANSFER' && tx.status === 'SUCCESS' && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRefundTx(tx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/30 text-purple-400 border border-purple-800/50 text-xs font-medium"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    Refund
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Type</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Amount</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Description</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-800 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RotateCcw className="w-10 h-10 text-gray-600" />
                      <p className="text-gray-400">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx: Transaction, i: number) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {typeIcon(tx.type)}
                        <span className={typeBadge(tx.type)}>{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${amountColor(tx.type)}`}>
                        {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}
                        ${tx.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusBadge(tx.status)}>{tx.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm max-w-[160px] truncate">
                      {tx.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-500">{tx.id.slice(0, 12)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.type === 'TRANSFER' && tx.status === 'SUCCESS' ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setRefundTx(tx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/30 text-purple-400 border border-purple-800/50 hover:bg-purple-900/50 transition-all text-xs font-medium"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                          Refund
                        </motion.button>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - desktop */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              Page {page + 1} of {data.totalPages} · {data.totalElements} total
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="btn-secondary px-3 py-2 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
                className="btn-secondary px-3 py-2 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pagination - mobile */}
      {data && data.totalPages > 1 && (
        <div className="md:hidden flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Page {page + 1}/{data.totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="btn-secondary px-3 py-2 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1}
              className="btn-secondary px-3 py-2 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      <AnimatePresence>
        {refundTx && (
          <RefundModal
            tx={refundTx}
            onClose={() => setRefundTx(null)}
            onConfirm={() => refundMutation.mutate(refundTx.id)}
            loading={refundMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
