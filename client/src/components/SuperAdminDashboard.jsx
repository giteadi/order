import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, ShoppingCart, Store, Settings, BarChart3, Home, 
  Plus, Building2, TrendingUp, DollarSign, UserCheck,
  ChevronRight, Activity, Globe, MoreVertical, Search,
  Filter, ArrowUpRight, ArrowDownRight, Crown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'

export const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const role = user?.role || 'customer'

  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalCustomers: 0,
    totalStaff: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    totalTables: 0,
    occupiedTables: 0,
  })
  const [restaurants, setRestaurants] = useState([])
  const [topRestaurants, setTopRestaurants] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state for new restaurant
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    subdomain: '',
    domain: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        console.log('Fetching super admin data...')

        // Fetch super admin stats
        const statsRes = await apiClient.get('/admin/super-admin/stats')
        console.log('Stats response:', statsRes.data)
        if (statsRes.data.success) {
          setStats(statsRes.data.data)
          setTopRestaurants(statsRes.data.data.topRestaurants || [])
          setRecentActivity(statsRes.data.data.recentActivity || [])
        }

        // Fetch all restaurants
        const restaurantsRes = await apiClient.get('/admin/restaurants')
        console.log('Restaurants response:', restaurantsRes.data)
        if (restaurantsRes.data.success) {
          setRestaurants(restaurantsRes.data.data || [])
          console.log('Restaurants loaded:', restaurantsRes.data.data?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        console.error('Error response:', error.response?.data)
      } finally {
        setLoading(false)
      }
    }

    if (role === 'super_admin') {
      console.log('Role is super_admin, fetching data...')
      fetchData()
    } else {
      console.log('Role is not super_admin:', role)
    }
  }, [role])

  // Handle create restaurant
  const handleCreateRestaurant = async (e) => {
    e.preventDefault()
    try {
      const response = await apiClient.post('/admin/restaurants', newRestaurant)
      if (response.data.success) {
        setShowAddModal(false)
        setNewRestaurant({
          name: '',
          subdomain: '',
          domain: '',
          description: '',
          address: '',
          phone: '',
          email: '',
          website: '',
        })
        // Refresh restaurants list
        const restaurantsRes = await apiClient.get('/admin/restaurants')
        if (restaurantsRes.data.success) {
          setRestaurants(restaurantsRes.data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to create restaurant:', error)
      alert('Failed to create restaurant: ' + (error.response?.data?.message || error.message))
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

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && restaurant.is_active) ||
                         (statusFilter === 'inactive' && !restaurant.is_active)
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Multi-Restaurant Management</p>
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
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Restaurants', value: stats.totalRestaurants, icon: Building2, color: 'bg-blue-500', trend: `${stats.activeRestaurants} active` },
            { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-green-500', trend: `Across all cafes` },
            { label: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: 'bg-orange-500', trend: `Admins & workers` },
            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-purple-500', trend: `All time` },
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

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingCart, color: 'bg-indigo-500' },
            { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: TrendingUp, color: 'bg-pink-500' },
            { label: 'Active Orders', value: stats.activeOrders, icon: Activity, color: 'bg-red-500' },
            { label: 'Occupied Tables', value: `${stats.occupiedTables}/${stats.totalTables}`, icon: Store, color: 'bg-cyan-500' },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Restaurants List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">All Restaurants</h2>
                  <p className="text-sm text-gray-500">Manage your restaurant network</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Plus size={18} />
                  Add Restaurant
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading...</div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Building2 size={24} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">No restaurants found</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first restaurant to get started</p>
                </div>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                            {restaurant.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                            <p className="text-xs text-gray-500">{restaurant.subdomain}.localhost</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            restaurant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {restaurant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 mt-3 text-center">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-900">{restaurant.stats?.customers || 0}</p>
                            <p className="text-xs text-gray-500">Customers</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-900">{restaurant.stats?.staff || 0}</p>
                            <p className="text-xs text-gray-500">Staff</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-900">{restaurant.stats?.totalOrders || 0}</p>
                            <p className="text-xs text-gray-500">Orders</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-900">₹{(restaurant.stats?.totalRevenue || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Revenue</p>
                          </div>
                        </div>

                        {restaurant.address && (
                          <p className="text-xs text-gray-400 mt-2">{restaurant.address}</p>
                        )}
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Top Performing Restaurants */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Top Performing</h2>
              <p className="text-sm text-gray-500">By total revenue</p>
            </div>
            <div className="divide-y divide-gray-100">
              {topRestaurants.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No data available</p>
                </div>
              ) : (
                topRestaurants.map((restaurant, index) => (
                  <div key={restaurant.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{restaurant.name}</p>
                        <p className="text-xs text-gray-500">{restaurant.order_count} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">{formatCurrency(restaurant.total_revenue)}</p>
                        {index > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <ArrowUpRight size={12} />
                            {((restaurant.total_revenue / (topRestaurants[0].total_revenue || 1)) * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Management Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">All Users</h3>
            <p className="text-sm text-gray-500 mt-1">Manage users across all cafes</p>
          </button>

          <button
            onClick={() => navigate('/admin/orders')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <ShoppingCart size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">All Orders</h3>
            <p className="text-sm text-gray-500 mt-1">View orders from all restaurants</p>
          </button>

          <button
            onClick={() => navigate('/admin/menu')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <Store size={24} className="text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Global Menu</h3>
            <p className="text-sm text-gray-500 mt-1">Manage shared menu items</p>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left border-2 border-dashed border-gray-200 hover:border-gray-300"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Plus size={24} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Add Restaurant</h3>
            <p className="text-sm text-gray-500 mt-1">Create new cafe/shop</p>
          </button>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/menu')}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Globe size={18} />
              View Customer App
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <BarChart3 size={18} />
              Refresh Data
            </button>
          </div>
        </motion.div>
      </div>

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Restaurant</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-500">×</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRestaurant} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="e.g., ArtHaus Café"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain *</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={newRestaurant.subdomain}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="arthaus"
                  />
                  <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-gray-500">
                    .localhost
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">This will be used for the restaurant URL</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain (optional)</label>
                <input
                  type="text"
                  value={newRestaurant.domain}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, domain: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="e.g., www.arthauscafe.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRestaurant.description}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  rows={2}
                  placeholder="Brief description of the restaurant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newRestaurant.phone}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newRestaurant.email}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={newRestaurant.website}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create Restaurant
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
