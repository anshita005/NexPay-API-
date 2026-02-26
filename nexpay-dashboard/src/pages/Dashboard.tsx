import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { walletApi } from '../api/walletApi'
import { paymentApi } from '../api/paymentApi'
import { useAuthStore } from '../store/authStore'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Transaction } from '../types'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
}

function StatCard({ title, value, icon: Icon, color, delay }: any) {
  return (
    <motion.div custom={delay} variants={cardVariants} initial="hidden" animate="visible" className="card">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-white truncate">{value}</p>
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ml-2 ${color}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

function txTypeIcon(type: string) {
  if (type === 'DEPOSIT') return <ArrowDownLeft className="w-4 h-4 text-green-400" />
  if (type === 'WITHDRAWAL') return <ArrowUpRight className="w-4 h-4 text-red-400" />
  return <ArrowLeftRight className="w-4 h-4 text-blue-400" />
}

function txColor(type: string) {
  if (type === 'DEPOSIT' || type === 'REFUND') return 'text-green-400'
  if (type === 'WITHDRAWAL') return 'text-red-400'
  return 'text-blue-400'
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => walletApi.getWallets().then((r) => r.data),
  })

  const { data: txPage } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => paymentApi.getHistory(0, 10).then((r) => r.data),
  })

  const totalBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) ?? 0
  const transactions = txPage?.content ?? []

  const deposits = transactions.filter((t) => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0)
  const withdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0)

  // Build chart data from transactions grouped by day
  const chartData = transactions
    .slice()
    .reverse()
    .reduce((acc: any[], tx: Transaction) => {
      const date = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const existing = acc.find((d) => d.date === date)
      if (existing) {
        existing.amount += tx.amount
      } else {
        acc.push({ date, amount: tx.amount })
      }
      return acc
    }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Good day, {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Here's what's happening with your account</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Balance" value={`$${totalBalance.toFixed(2)}`} icon={Wallet} color="bg-brand-600" delay={0} />
        <StatCard title="Wallets" value={wallets?.length ?? 0} icon={TrendingUp} color="bg-purple-600" delay={1} />
        <StatCard title="Total Deposits" value={`$${deposits.toFixed(2)}`} icon={ArrowDownLeft} color="bg-green-600" delay={2} />
        <StatCard title="Total Withdrawn" value={`$${withdrawals.toFixed(2)}`} icon={ArrowUpRight} color="bg-red-600" delay={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Transaction Activity</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-500">
              No transaction data yet
            </div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No transactions yet</p>
            ) : (
              transactions.slice(0, 6).map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {txTypeIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.type}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${txColor(tx.type)}`}>
                    {tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER' ? '-' : '+'}${tx.amount.toFixed(2)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
