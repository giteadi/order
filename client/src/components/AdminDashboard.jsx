import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Users, ShoppingCart, Menu as MenuIcon, Settings, BarChart3, LogOut, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role || 'customer'

  // Redirect if not admin or super admin
  if (role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Settings size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You don't have permission to access this page</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, path: '/admin/overview' },
    { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
    { id: 'orders', label: 'Order Management', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'menu', label: 'Menu Management', icon: MenuIcon, path: '/admin/menu' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ]

  // Super admin only items
  if (role === 'super_admin') {
    menuItems.push({ id: 'admins', label: 'Admin Management', icon: Users, path: '/admin/admins' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Settings size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-400 capitalize">{role.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Home size={18} />
                <span className="hidden sm:inline">Back to App</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-500' },
            { label: 'Active Orders', value: '45', icon: ShoppingCart, color: 'bg-green-500' },
            { label: 'Menu Items', value: '89', icon: MenuIcon, color: 'bg-orange-500' },
            { label: 'Revenue Today', value: '₹12,450', icon: BarChart3, color: 'bg-purple-500' },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon size={24} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">Manage {item.label.toLowerCase()}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors">
              Add New Menu Item
            </button>
            <button className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors">
              View Today's Orders
            </button>
            <button className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors">
              Generate Report
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
