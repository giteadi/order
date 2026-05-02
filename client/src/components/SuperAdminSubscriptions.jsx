import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Crown, ArrowLeft, Search, Filter, CreditCard, Users, DollarSign,
  Calendar, Clock, AlertTriangle, Ban, CheckCircle, MoreVertical,
  TrendingUp, TrendingDown, Package, X, Check, AlertCircle
} from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import apiClient from '../services/api'

export const SuperAdminSubscriptions = () => {
  const navigate = useNavigateWithParams()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role || 'customer'

  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    pendingSubscriptions: 0,
    expiredSubscriptions: 0,
    blockedSubscriptions: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    todayRevenue: 0,
    planBreakdown: []
  })
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch subscriptions
        const subsRes = await apiClient.get('/admin/super-admin/subscriptions')
        if (subsRes.data.success) {
          setSubscriptions(subsRes.data.data || [])
        }

        // Fetch stats
        const statsRes = await apiClient.get('/admin/super-admin/subscriptions/stats')
        if (statsRes.data.success) {
          setStats(statsRes.data.data)
        }

        // Fetch expiring subscriptions
        const expiringRes = await apiClient.get('/admin/super-admin/subscriptions/expiring?days=7')
        if (expiringRes.data.success) {
          setExpiring(expiringRes.data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch subscription data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (role === 'super_admin') {
      fetchData()
    }
  }, [role])

  // Block/Unblock subscription
  const handleBlockUnblock = async (subscription, isBlocked) => {
    try {
      const response = await apiClient.patch(
        `/admin/super-admin/subscriptions/${subscription.id}/block`,
        { isBlocked, reason: isBlocked ? blockReason : '' }
      )

      if (response.data.success) {
        // Update local state
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === subscription.id 
              ? { 
                  ...sub, 
                  is_manually_blocked: isBlocked ? 1 : 0,
                  block_reason: isBlocked ? blockReason : null,
                  blocked_at: isBlocked ? new Date().toISOString() : null
                }
              : sub
          )
        )
        
        setShowBlockModal(false)
        setBlockReason('')
        setSelectedSubscription(null)

        // Refresh stats
        const statsRes = await apiClient.get('/admin/super-admin/subscriptions/stats')
        if (statsRes.data.success) {
          setStats(statsRes.data.data)
        }
      }
    } catch (error) {
      console.error('Failed to update subscription status:', error)
      alert('Failed to update subscription status')
    }
  }

  // Redirect if not super admin
  if (role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Crown size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">Super Admin access only</p>
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diff = end - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // Group subscriptions by restaurant
  const groupedByRestaurant = subscriptions.reduce((acc, sub) => {
    const restaurantName = sub.restaurant_name || 'No Restaurant'
    if (!acc[restaurantName]) {
      acc[restaurantName] = []
    }
    acc[restaurantName].push(sub)
    return acc
  }, {})

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'blocked' && sub.is_manually_blocked) ||
      (activeTab === 'active' && sub.status === 'active' && !sub.is_manually_blocked) ||
      (activeTab === 'pending' && sub.status === 'pending') ||
      (activeTab === 'expired' && sub.status === 'expired')
    
    return matchesSearch && matchesTab
  })

  // Get filtered restaurant names
  const filteredRestaurantNames = Object.keys(groupedByRestaurant).filter(restaurantName => {
    const hasMatchingSub = groupedByRestaurant[restaurantName].some(sub => {
      const matchesSearch = 
        sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'blocked' && sub.is_manually_blocked) ||
        (activeTab === 'active' && sub.status === 'active' && !sub.is_manually_blocked) ||
        (activeTab === 'pending' && sub.status === 'pending') ||
        (activeTab === 'expired' && sub.status === 'expired')
      
      return matchesSearch && matchesTab
    })
    return hasMatchingSub
  })

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    blocked: 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <div className="bg-gray-900 text-white w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Subscription Management</h1>
                <p className="text-sm text-gray-400">Manage all subscriptions & revenue</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/super-admin')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Total Subscriptions', 
              value: stats.totalSubscriptions, 
              icon: Package, 
              color: 'bg-blue-500',
              trend: `${stats.activeSubscriptions} active`
            },
            { 
              label: 'Total Revenue', 
              value: formatCurrency(stats.totalRevenue), 
              icon: DollarSign, 
              color: 'bg-green-500',
              trend: `All time`
            },
            { 
              label: 'Monthly Revenue', 
              value: formatCurrency(stats.monthlyRevenue), 
              icon: TrendingUp, 
              color: 'bg-purple-500',
              trend: `This month`
            },
            { 
              label: 'Blocked', 
              value: stats.blockedSubscriptions, 
              icon: Ban, 
              color: 'bg-red-500',
              trend: `Suspended`
            },
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
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.trend}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Plan Summary - 3 Cards Only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Available Plans</h2>
            <p className="text-sm text-gray-500">3 subscription tiers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {stats.planBreakdown.slice(0, 3).map((plan, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                  <span className="text-lg font-bold text-blue-600">₹{plan.price}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{plan.count}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{plan.active_count}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(plan.revenue)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expiring Soon Alert */}
        {expiring.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-600" size={24} />
              <div>
                <h3 className="font-semibold text-amber-900">
                  {expiring.length} Subscription{expiring.length > 1 ? 's' : ''} Expiring Soon
                </h3>
                <p className="text-sm text-amber-700">
                  Will expire within 7 days
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Subscriptions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {/* Tabs & Filters */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">All Subscriptions</h2>
                <p className="text-sm text-gray-500">{filteredSubscriptions.length} subscriptions found across {filteredRestaurantNames.length} restaurants</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['all', 'active', 'pending', 'expired', 'blocked'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search restaurant, user, plan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 w-64"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions List by Restaurant */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading...</p>
              </div>
            ) : filteredRestaurantNames.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package size={24} className="text-gray-400" />
                </div>
                <p className="text-lg font-medium">No subscriptions found</p>
              </div>
            ) : (
              filteredRestaurantNames.map((restaurantName) => (
                <div key={restaurantName} className="p-6 hover:bg-gray-50 transition-colors">
                  {/* Restaurant Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                        {restaurantName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{restaurantName}</h3>
                        <p className="text-sm text-gray-500">
                          {groupedByRestaurant[restaurantName].length} subscription(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(
                          groupedByRestaurant[restaurantName]
                            .filter(s => s.status === 'active')
                            .reduce((sum, s) => sum + (s.plan_price || 0), 0)
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Subscriptions Table for this Restaurant */}
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-400 uppercase">
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 pr-4">Plan</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Valid Until</th>
                        <th className="pb-3 pr-4">Amount</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByRestaurant[restaurantName]
                        .filter(sub => {
                          const matchesSearch = 
                            sub.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sub.plan_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            sub.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase())
                          
                          const matchesTab = activeTab === 'all' || 
                            (activeTab === 'blocked' && sub.is_manually_blocked) ||
                            (activeTab === 'active' && sub.status === 'active' && !sub.is_manually_blocked) ||
                            (activeTab === 'pending' && sub.status === 'pending') ||
                            (activeTab === 'expired' && sub.status === 'expired')
                          
                          return matchesSearch && matchesTab
                        })
                        .map((sub) => (
                          <tr key={sub.id} className="border-t border-gray-50">
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium text-gray-900">{sub.user_name}</p>
                                <p className="text-sm text-gray-500">{sub.user_email}</p>
                                <p className="text-xs text-gray-400">{sub.user_phone}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium text-gray-900">{sub.plan_name}</p>
                                <p className="text-sm text-gray-500">{sub.duration_months} month(s)</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${statusColors[sub.status]}`}>
                                  {sub.status}
                                </span>
                                {sub.is_manually_blocked ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 w-fit">
                                    <Ban size={12} className="mr-1" />
                                    Blocked
                                  </span>
                                ) : sub.status === 'active' && getDaysRemaining(sub.end_date) <= 7 && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 w-fit">
                                    <AlertTriangle size={12} className="mr-1" />
                                    Expiring Soon
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <div>
                                <p className="text-sm text-gray-900">{formatDate(sub.end_date)}</p>
                                {sub.status === 'active' && (
                                  <p className={`text-xs ${getDaysRemaining(sub.end_date) <= 7 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {getDaysRemaining(sub.end_date)} days left
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-900">{formatCurrency(sub.plan_price)}</p>
                            </td>
                            <td className="py-3">
                              {sub.status === 'active' && (
                                <button
                                  onClick={() => {
                                    setSelectedSubscription(sub)
                                    setShowBlockModal(true)
                                  }}
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    sub.is_manually_blocked
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}
                                >
                                  {sub.is_manually_blocked ? (
                                    <>
                                      <CheckCircle size={12} />
                                      Unblock
                                    </>
                                  ) : (
                                    <>
                                      <Ban size={12} />
                                      Block
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Block/Unblock Modal */}
      {showBlockModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedSubscription.is_manually_blocked ? 'Unblock Subscription' : 'Block Subscription'}
              </h3>
              <button
                onClick={() => {
                  setShowBlockModal(false)
                  setBlockReason('')
                  setSelectedSubscription(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                  {selectedSubscription.restaurant_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedSubscription.restaurant_name || 'Unknown Restaurant'}</p>
                  <p className="text-sm text-gray-500">{selectedSubscription.user_name} • {selectedSubscription.plan_name}</p>
                </div>
              </div>

              {selectedSubscription.is_manually_blocked ? (
                <p className="text-sm text-gray-600">
                  Are you sure you want to unblock this subscription? The user will regain access to all features.
                </p>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for blocking (optional)
                  </label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    The user will be immediately blocked from accessing the system.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false)
                  setBlockReason('')
                  setSelectedSubscription(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockUnblock(selectedSubscription, !selectedSubscription.is_manually_blocked)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  selectedSubscription.is_manually_blocked
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {selectedSubscription.is_manually_blocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminSubscriptions
