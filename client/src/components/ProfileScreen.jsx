import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { User, Mail, LogOut, Settings, CreditCard, Bell, HelpCircle } from 'lucide-react'
import { logout } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export const ProfileScreen = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={40} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-500 mb-4">Please login to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const menuItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: CreditCard, label: 'Payment Methods', path: '/payments' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <div className="flex items-center gap-4">
            {user.avatarBase64 || user.avatarUrl ? (
              <img
                src={user.avatarBase64 || user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {user.role || 'Customer'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900">{item.label}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full bg-white border-2 border-red-500 text-red-500 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </motion.button>
      </div>
    </div>
  )
}
