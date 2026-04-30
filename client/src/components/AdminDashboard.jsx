import { useSelector } from 'react-redux'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Users, ShoppingCart, Menu as MenuIcon, Settings, BarChart3, Home, Table, Clock, CheckCircle, ChefHat, Package, XCircle, Crown, Building2, Image as ImageIcon, ChevronDown, ChevronUp, Check, Truck } from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const AdminDashboard = () => {
  const navigate = useNavigateWithParams()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role || 'customer'

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalStaff: 0,
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
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const rateLimitUntilRef = useRef(0)

  // Fetch dashboard data
  useEffect(() => {
    fetchData({ silent: false })

    const intervalId = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }
      if (Date.now() < rateLimitUntilRef.current) {
        return
      }
      fetchData({ silent: true })
    }, 15000)

    return () => clearInterval(intervalId)
  }, [role])

  const fetchData = async ({ silent } = { silent: false }) => {
    try {
      if (!silent) {
        setLoading(true)
      }

      // Fetch stats
      const statsRes = await apiClient.get('/admin/stats')
      if (statsRes.data.success) {
        setStats(prev => {
          const next = statsRes.data.data
          const same = JSON.stringify(prev) === JSON.stringify(next)
          return same ? prev : next
        })
      }

      // Fetch active orders
      const ordersRes = await apiClient.get('/admin/orders/active')
      if (ordersRes.data.success) {
        // Additional frontend filter for safety - strict match only
        const filteredOrders = ordersRes.data.data.filter(order => 
          order.restaurant_id === user?.restaurantId
        )
        setOrders(prev => {
          const prevSig = prev.map(o => `${o.id}:${o.status}`).join(',')
          const nextSig = filteredOrders.map(o => `${o.id}:${o.status}`).join(',')
          return prevSig === nextSig ? prev : filteredOrders
        })
      }

      // Fetch occupied tables
      const tablesRes = await apiClient.get('/admin/tables/occupied')
      if (tablesRes.data.success) {
        // Filter tables by restaurant_id
        const filteredTables = tablesRes.data.data.filter(table => 
          table.restaurant_id === user?.restaurantId
        )
        setTables(prev => {
          const prevIds = prev.map(t => t.id).join(',')
          const nextIds = filteredTables.map(t => t.id).join(',')
          return prevIds === nextIds ? prev : filteredTables
        })
      }
    } catch (error) {
      if (error?.response?.status === 429) {
        rateLimitUntilRef.current = Date.now() + 60000
      }
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      const response = await apiClient.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus
      })

      if (response.data.success) {
        if (newStatus === 'confirmed') {
          toast.success('Order accepted!')
        } else if (newStatus === 'served') {
          toast.success('Order delivered!')
        } else if (newStatus === 'cancelled') {
          toast.success('Order cancelled!')
        }

        if (newStatus === 'served' || newStatus === 'cancelled') {
          setOrders(prev => prev.filter(o => o.id !== orderId))
          setExpandedOrder(prev => (prev === orderId ? null : prev))
        }

        // Force non-silent refresh to update UI immediately
        await fetchData({ silent: false })
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

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
      <div className={`${role === 'super_admin' ? 'bg-gradient-to-r from-purple-900 via-gray-900 to-gray-900' : 'bg-gray-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                role === 'super_admin' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-white/10'
              }`}>
                {role === 'super_admin' ? <Crown size={20} /> : <Settings size={20} />}
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                </h1>
                <p className="text-sm text-gray-400 capitalize">
                  {role === 'super_admin' ? 'Full system access' : 'Restaurant management'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {role === 'super_admin' && (
                <button
                  onClick={() => navigate('/super-admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg transition-colors"
                >
                  <Building2 size={18} />
                  <span className="hidden sm:inline">Multi-Restaurant View</span>
                </button>
              )}
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
            role === 'super_admin' 
              ? { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-indigo-500' }
              : { label: 'Total Staff', value: stats.totalStaff || 0, icon: Users, color: 'bg-indigo-500' },
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
                <button 
                  onClick={() => navigate('/admin/orders')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 h-80 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingCart size={24} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">No active orders</p>
                  <p className="text-sm text-gray-400 mt-1">New orders will appear here</p>
                </div>
              ) : (
                orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  const isExpanded = expandedOrder === order.id
                  const isUpdating = updatingOrder === order.id
                  
                  return (
                    <div key={order.id} className="hover:bg-gray-50 transition-colors">
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
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
                            
                            {/* Order Items Preview */}
                            {order.items && order.items.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {order.items.map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                                    <span className="font-medium">{item.quantity}x</span>
                                    <span>{item.product_name}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-500 mt-2">
                              ₹{order.total_amount} • {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIcon size={18} className="text-gray-400" />
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                disabled={isUpdating}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Check size={16} />
                                {isUpdating ? 'Accepting...' : 'Accept Order'}
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                disabled={isUpdating}
                                className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          
                          {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') && (
                            <>
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'served')}
                                disabled={isUpdating}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <Truck size={16} />
                                {isUpdating ? 'Delivering...' : 'Mark as Delivered'}
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                disabled={isUpdating}
                                className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Order Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                          <div className="pt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Order Details:</p>
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                      {item.quantity}
                                    </span>
                                    <span className="text-gray-900">{item.product_name || 'Unknown Item'}</span>
                                  </div>
                                  <span className="text-gray-600 font-medium">₹{(item.product_price || item.price_at_time || 0) * item.quantity}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 italic">No items found</p>
                            )}
                            
                            {order.special_instructions && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Special Instructions:</p>
                                <p className="text-sm text-gray-600">{order.special_instructions}</p>
                              </div>
                            )}
                            
                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">Total:</span>
                              <span className="text-lg font-bold text-gray-900">₹{order.total_amount}</span>
                            </div>
                          </div>
                        </div>
                      )}
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
                <button 
                  onClick={() => navigate('/admin/tables')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100 h-80 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading...</div>
              ) : tables.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Table size={24} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">No occupied tables</p>
                  <p className="text-sm text-gray-400 mt-1">Occupied tables will appear here</p>
                </div>
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

        {/* Management Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {role === 'super_admin' && (
            <button
              onClick={() => navigate('/super-admin')}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left border-2 border-purple-100"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Building2 size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Restaurant Network</h3>
              <p className="text-sm text-gray-500 mt-1">Manage all restaurants & cafes</p>
            </button>
          )}

          <button
            onClick={() => navigate('/admin/menu')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <MenuIcon size={24} className="text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Menu Management</h3>
            <p className="text-sm text-gray-500 mt-1">Add, edit & manage products</p>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-500 mt-1">Manage users & roles</p>
          </button>

          <button
            onClick={() => navigate('/admin/orders')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <ShoppingCart size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Order Management</h3>
            <p className="text-sm text-gray-500 mt-1">View & manage all orders</p>
          </button>

          <button
            onClick={() => navigate('/admin/tables')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
              <Table size={24} className="text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Table Management</h3>
            <p className="text-sm text-gray-500 mt-1">Manage restaurant tables</p>
          </button>

          <button
            onClick={() => navigate('/admin/carousel')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-4">
              <ImageIcon size={24} className="text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Carousel Images</h3>
            <p className="text-sm text-gray-500 mt-1">Manage highlight images</p>
          </button>

          {role !== 'super_admin' && (
            <button
              onClick={() => navigate('/admin/settings')}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Settings size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Restaurant configuration</p>
            </button>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/menu')}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              Customer Menu
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <BarChart3 size={18} />
              Refresh Data
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Home size={18} />
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
