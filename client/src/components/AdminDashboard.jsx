import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, ShoppingCart, Menu as MenuIcon, Settings, BarChart3, Home, Table, Clock, CheckCircle, ChefHat, Package, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role || 'customer'

  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    occupiedTables: 0,
    totalTables: 0,
    menuItems: 0,
  })
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch stats
        const statsRes = await apiClient.get('/admin/stats')
        if (statsRes.data.success) {
          setStats(statsRes.data.data)
        }

        // Fetch active orders
        const ordersRes = await apiClient.get('/admin/orders/active')
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.data)
        }

        // Fetch occupied tables
        const tablesRes = await apiClient.get('/admin/tables/occupied')
        if (tablesRes.data.success) {
          setTables(tablesRes.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (role === 'admin' || role === 'super_admin') {
      fetchData()
    }
  }, [role])

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'preparing': return 'bg-orange-100 text-orange-700'
      case 'ready': return 'bg-green-100 text-green-700'
      case 'served': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'confirmed': return CheckCircle
      case 'preparing': return ChefHat
      case 'ready': return Package
      case 'served': return CheckCircle
      case 'completed': return CheckCircle
      case 'cancelled': return XCircle
      default: return Clock
    }
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
            { label: 'Today Orders', value: stats.todayOrders, icon: ShoppingCart, color: 'bg-blue-500' },
            { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'bg-orange-500' },
            { label: 'Occupied Tables', value: `${stats.occupiedTables}/${stats.totalTables}`, icon: Table, color: 'bg-green-500' },
            { label: 'Today Revenue', value: `₹${stats.todayRevenue}`, icon: BarChart3, color: 'bg-purple-500' },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Active Orders</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active orders</div>
              ) : (
                orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  return (
                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">Order #{order.uuid?.slice(-6)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {order.user_name || 'Guest'} • Table {order.table_number || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ₹{order.total_amount} • {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon size={18} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Occupied Tables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Occupied Tables</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : tables.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No occupied tables</div>
              ) : (
                tables.map((table) => (
                  <div key={table.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">Table {table.table_number}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Occupied
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {table.user_name || 'Guest'} {table.user_phone && `• ${table.user_phone}`}
                        </p>
                        {table.order_id && (
                          <p className="text-sm text-gray-500 mt-1">
                            Order #{table.order_uuid?.slice(-6)} • {table.order_status}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/menu')}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors text-left flex items-center gap-2"
            >
              <MenuIcon size={18} />
              View Menu
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors text-left flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              View Orders
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors text-left flex items-center gap-2"
            >
              <BarChart3 size={18} />
              Refresh Data
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors text-left flex items-center gap-2"
            >
              <Home size={18} />
              Back to App
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
