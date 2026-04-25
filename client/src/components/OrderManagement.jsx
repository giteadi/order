import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Filter, Calendar, Clock, CheckCircle, Package, ChefHat, XCircle, MapPin, Phone, User, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'

export const OrderManagement = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [expandedOrder, setExpandedOrder] = useState(null)

  // Fetch orders
  useEffect(() => {
    fetchOrders()
  }, [dateFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let endpoint = '/admin/orders'
      
      if (dateFilter === 'today') {
        endpoint = '/admin/orders/today'
      } else if (dateFilter === 'active') {
        endpoint = '/admin/orders/active'
      }

      const response = await apiClient.get(endpoint)
      if (response.data.success) {
        setOrders(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await apiClient.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      fetchOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'preparing': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-700 border-green-200'
      case 'served': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
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

  const getNextStatuses = (currentStatus) => {
    const flow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['served', 'cancelled'],
      served: ['completed'],
      completed: [],
      cancelled: ['pending'],
    }
    return flow[currentStatus] || []
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.uuid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.table_number?.toString().includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const orderStats = {
    total: orders.length,
    revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold">Order Management</h1>
                <p className="text-sm text-gray-400">Manage all restaurant orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{orderStats.revenue}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Preparing</p>
            <p className="text-2xl font-bold text-orange-600">{orderStats.preparing}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Ready</p>
            <p className="text-2xl font-bold text-green-600">{orderStats.ready}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-gray-600">{orderStats.completed}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order ID, customer name, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none bg-white"
          >
            <option value="today">Today's Orders</option>
            <option value="active">Active Orders</option>
            <option value="all">All Orders</option>
          </select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            filteredOrders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status)
              const isExpanded = expandedOrder === order.id

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                          <StatusIcon size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              Order #{order.uuid?.slice(-8)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {order.user_name || 'Guest'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              Table {order.table_number || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(order.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gray-900">₹{order.total_amount}</span>
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                  {item.quantity}
                                </span>
                                <span className="text-gray-900">{item.product_name || 'Unknown Item'}</span>
                              </div>
                              <span className="text-gray-600">₹{item.price_at_time * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium text-gray-900">{order.user_name || 'Guest'}</p>
                          {order.user_phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Phone size={14} /> {order.user_phone}
                            </p>
                          )}
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-gray-500">Order Info</p>
                          <p className="font-medium text-gray-900">Table {order.table_number || 'N/A'}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {order.special_instructions && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                          <p className="text-sm text-yellow-700">{order.special_instructions}</p>
                        </div>
                      )}

                      {/* Status Actions */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-700 self-center mr-2">Update Status:</span>
                        {getNextStatuses(order.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(order.id, status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${getStatusColor(status)} hover:opacity-80`}
                          >
                            Mark as {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No orders found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
