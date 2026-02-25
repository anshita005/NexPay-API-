import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, LayoutDashboard, Wallet, ArrowLeftRight, LogOut, User, Send, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { to: '/wallets', icon: Wallet, label: 'Wallets', adminOnly: false },
  { to: '/transfer', icon: Send, label: 'Transfer', adminOnly: false },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions', adminOnly: false },
  { to: '/admin', icon: ShieldCheck, label: 'Admin Panel', adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">NexPay</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems
          .filter(({ adminOnly }) => !adminOnly || user?.role === 'ADMIN')
          .map(({ to, icon: Icon, label, adminOnly }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? adminOnly
                      ? 'bg-brand-600/20 text-brand-400 border border-brand-600/40'
                      : 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
              {adminOnly && (
                <span className="ml-auto text-xs bg-brand-900/50 text-brand-400 border border-brand-800/50 px-1.5 py-0.5 rounded-md">
                  ADMIN
                </span>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </motion.aside>
  )
}
