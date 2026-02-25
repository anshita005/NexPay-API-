import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, ArrowLeftRight, Search,
  ChevronLeft, ChevronRight, ShieldCheck,
  ArrowDownLeft, ArrowUpRight
} from 'lucide-react'
import axiosClient from '../api/axiosClient'
import type { PageResponse, User, Transaction } from '../types'

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

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex items-center justify-between"
    >
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </motion.div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users')
  const [userPage, setUserPage] = useState(0)
  const [txPage, setTxPage] = useState(0)
  const [userSearch, setUserSearch] = useState('')
  const [txSearch, setTxSearch] = useState('')

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userPage],
    queryFn: () => axiosClient.get<PageResponse<User>>(`/api/v1/admin/users?page=${userPage}&size=10`).then(r => r.data),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['admin-transactions', txPage],
    queryFn: () => axiosClient.get<PageResponse<Transaction>>(`/api/v1/admin/transactions?page=${txPage}&size=10`).then(r => r.data),
  })

  const filteredUsers = (usersData?.content ?? []).filter((u: User) =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredTx = (txData?.content ?? []).filter((t: Transaction) =>
    t.type.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.status.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.amount.toString().includes(txSearch)
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-0.5">Full system overview</p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Users" value={usersData?.totalElements ?? '—'} icon={Users} color="bg-brand-600" />
        <StatCard title="Total Transactions" value={txData?.totalElements ?? '—'} icon={ArrowLeftRight} color="bg-purple-600" />
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex gap-2 border-b border-gray-800 mb-6">
          {(['users', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-all duration-200 border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'users' ? `Users (${usersData?.totalElements ?? 0})` : `Transactions (${txData?.totalElements ?? 0})`}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input pl-11"
              />
            </div>

            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {usersLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(4)].map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-gray-800 rounded animate-pulse w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: User, i: number) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-600/30 border border-brand-600/50 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-brand-400 text-xs font-bold">
                                {user.fullName?.charAt(0).toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <span className="text-white text-sm font-medium">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            user.role === 'ADMIN'
                              ? 'bg-brand-900/40 text-brand-400 border-brand-800'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }`}>
                            {user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 mr-1" />}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>

              {usersData && usersData.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400">Page {userPage + 1} of {usersData.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setUserPage(p => Math.max(0, p - 1))} disabled={userPage === 0} className="btn-secondary px-3 py-2 disabled:opacity-40">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setUserPage(p => Math.min(usersData.totalPages - 1, p + 1))} disabled={userPage >= usersData.totalPages - 1} className="btn-secondary px-3 py-2 disabled:opacity-40">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Filter by type, status or amount..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="input pl-11"
              />
            </div>

            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Type', 'Amount', 'Status', 'Description', 'Date', 'ID'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {txLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-gray-800 rounded animate-pulse w-20" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions found</td>
                    </tr>
                  ) : (
                    filteredTx.map((tx: Transaction, i: number) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {typeIcon(tx.type)}
                            <span className={typeBadge(tx.type)}>{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">${tx.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={statusBadge(tx.status)}>{tx.status}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm max-w-[160px] truncate">{tx.description || '—'}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id.slice(0, 12)}...</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>

              {txData && txData.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400">Page {txPage + 1} of {txData.totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setTxPage(p => Math.max(0, p - 1))} disabled={txPage === 0} className="btn-secondary px-3 py-2 disabled:opacity-40">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTxPage(p => Math.min(txData.totalPages - 1, p + 1))} disabled={txPage >= txData.totalPages - 1} className="btn-secondary px-3 py-2 disabled:opacity-40">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
