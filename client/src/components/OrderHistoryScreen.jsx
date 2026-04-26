import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle, Package, XCircle, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'

export const OrderHistoryScreen = () => {
  const navigate = useNavigateWithParams()
  const [searchParams] = useSearchParams()
  const restaurant = searchParams.get('restaurant')
  const user = useSelector((state) => state.auth.user)
  const token = useSelector((state) => state.auth.token)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)

  // Save restaurant to localStorage when available
  useEffect(() => {
    if (restaurant) {
      localStorage.setItem('lastRestaurant', restaurant)
    }
  }, [restaurant])

  useEffect(() => {
    if (!user || !token) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [user, token, restaurant])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        setOrders(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'preparing': return 'bg-orange-100 text-orange-700'
      case 'ready': return 'bg-green-100 text-green-700'
      case 'served': return 'bg-purple-100 text-purple-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'confirmed': return CheckCircle
      case 'preparing': return Clock
      case 'ready': return Package
      case 'served': return CheckCircle
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'confirmed': return 'Confirmed'
      case 'preparing': return 'Preparing'
      case 'ready': return 'Ready'
      case 'served': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Order History</h1>
                <p className="text-sm text-orange-100">Your past orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-orange-100">Total Orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <ShoppingBag size={40} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              const isExpanded = expandedOrder === order.id

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">Order #{order.uuid?.slice(-6)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Table {order.table_number || 'N/A'} • {order.item_count || 0} items
                        </p>
                      </div>
                      <StatusIcon size={20} className="text-gray-400" />
                    </div>

                    {/* Order Info */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <span className="text-xl font-bold text-gray-900">₹{order.total_amount}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          <span>Hide Details</span>
                          <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          <span>View Details</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <div className="pt-3 space-y-2">
                        {/* Cancelled Message */}
                        {order.status === 'cancelled' && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                              <XCircle size={18} />
                              <p className="text-sm font-medium">This order was cancelled</p>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              {order.cancelled_at 
                                ? `Cancelled on ${new Date(order.cancelled_at).toLocaleString('en-IN')}`
                                : 'Order cancelled by restaurant'
                              }
                            </p>
                          </div>
                        )}

                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Order Items:
                        </p>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                                  {item.quantity}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.product_name || 'Unknown Item'}</p>
                                  <p className="text-xs text-gray-500">₹{item.product_price || 0} each</p>
                                </div>
                              </div>
                              <span className="text-gray-900 font-semibold">
                                ₹{(item.product_price || 0) * item.quantity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No items found</p>
                        )}

                        {order.special_instructions && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                              Special Instructions:
                            </p>
                            <p className="text-sm text-gray-600">{order.special_instructions}</p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Subtotal:</span>
                            <span className="text-sm text-gray-900">₹{order.subtotal || order.total_amount}</span>
                          </div>
                          {order.tax_amount > 0 && (
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-gray-600">Tax:</span>
                              <span className="text-sm text-gray-900">₹{order.tax_amount}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-base font-semibold text-gray-900">Total:</span>
                            <span className="text-xl font-bold text-orange-600">₹{order.total_amount}</span>
                          </div>
                        </div>

                        {/* Reorder Button */}
                        {order.status === 'served' && (
                          <div className="space-y-2">
                            <button
                              onClick={() => navigate('/menu')}
                              className="w-full mt-3 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                            >
                              Order Again
                            </button>
                            <button
                              onClick={() => navigate('/menu')}
                              className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                              Browse Menu
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
