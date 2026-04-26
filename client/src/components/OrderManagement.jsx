import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle, ChefHat, Package, XCircle, Check, Truck, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const OrderManagement = () => {
  const navigate = useNavigateWithParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('active')

  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let endpoint = '/admin/orders/active'
      
      if (filterStatus === 'all') {
        endpoint = '/admin/orders'
      } else if (filterStatus === 'today') {
        endpoint = '/admin/orders/today'
      } else if (filterStatus === 'completed') {
        endpoint = '/admin/orders?status=served'
      } else if (filterStatus === 'cancelled') {
        endpoint = '/admin/orders?status=cancelled'
      }

      const response = await apiClient.get(endpoint)
      if (response.data.success) {
        setOrders(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

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
        await fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
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
      {/* Header */}
      <div className="bg-gray-900 text-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">All Orders</h1>
                <p className="text-sm text-gray-400">Manage all restaurant orders</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-gray-400">Total Orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'active'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setFilterStatus('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'today'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today's Orders
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'cancelled'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">No orders match the selected filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              const isExpanded = expandedOrder === order.id
              const isUpdating = updatingOrder === order.id

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
                          <span className="font-bold text-gray-900">#{order.uuid?.slice(-6)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.user_name || 'Guest'} • Table {order.table_number || 'N/A'}
                        </p>
                      </div>
                      <StatusIcon size={20} className="text-gray-400" />
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                            <span className="font-medium">{item.quantity}x</span>
                            <span>{item.product_name}</span>
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-500">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Order Info */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <span className="text-lg font-bold text-gray-900">₹{order.total_amount}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            disabled={isUpdating}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Check size={16} />
                            {isUpdating ? 'Accepting...' : 'Accept'}
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
                            {isUpdating ? 'Delivering...' : 'Deliver'}
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

                      {(order.status === 'served' || order.status === 'cancelled') && (
                        <div className="flex-1 text-center py-2 text-sm text-gray-500">
                          Order {order.status === 'served' ? 'completed' : order.status}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                      <div className="pt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                          Order Details:
                        </p>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-900">{item.product_name || 'Unknown Item'}</span>
                              </div>
                              <span className="text-gray-600 font-medium">
                                ₹{(item.product_price || item.price_at_time || 0) * item.quantity}
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

                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Total:</span>
                          <span className="text-lg font-bold text-gray-900">₹{order.total_amount}</span>
                        </div>
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
