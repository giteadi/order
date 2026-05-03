import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, ShoppingCart, Store, Settings, BarChart3, Home,
  Plus, Building2, TrendingUp, DollarSign, UserCheck,
  ChevronRight, Activity, Globe, MoreVertical, Search,
  Filter, ArrowUpRight, ArrowDownRight, Crown, ArrowLeft, QrCode,
  CreditCard
} from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import apiClient from '../services/api'
import AddRestaurant from './AddRestaurant'
import { RestaurantDetailScreen } from './RestaurantDetailScreen'

export const SuperAdminDashboard = () => {
  const navigate = useNavigateWithParams()
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
    totalSubscriptions: 0,
  })
  const [restaurants, setRestaurants] = useState([])
  const [createdRestaurant, setCreatedRestaurant] = useState(null)
  const [topRestaurants, setTopRestaurants] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Detail screen states
  const [activeScreen, setActiveScreen] = useState(null) // 'customers', 'staff', 'restaurants', 'revenue', 'orders', 'tables', 'restaurant-detail'
  const [screenFilter, setScreenFilter] = useState('all')
  const [screenSearch, setScreenSearch] = useState('')
  const [screenData, setScreenData] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [editMode, setEditMode] = useState(false)

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch super admin stats
        const statsRes = await apiClient.get('/admin/super-admin/stats')
        if (statsRes.data.success) {
          setStats(statsRes.data.data)
          setTopRestaurants(statsRes.data.data.topRestaurants || [])
          setRecentActivity(statsRes.data.data.recentActivity || [])
        }

        // Fetch all restaurants
        const restaurantsRes = await apiClient.get('/admin/restaurants')
        if (restaurantsRes.data.success) {
          const restaurantsData = restaurantsRes.data.data || []
          
          // Fetch tables to count per restaurant
          const tablesRes = await apiClient.get('/admin/super-admin/tables')
          if (tablesRes.data.success) {
            const tables = tablesRes.data.data || []
            
            // Add table count to each restaurant
            const restaurantsWithTableCount = restaurantsData.map(restaurant => {
              const tableCount = tables.filter(t => t.restaurant_name === restaurant.name).length
              return {
                ...restaurant,
                stats: {
                  ...restaurant.stats,
                  tables: tableCount
                }
              }
            })
            setRestaurants(restaurantsWithTableCount)
          } else {
            setRestaurants(restaurantsData)
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (role === 'super_admin') {
      fetchData()
    }
  }, [role])

  // Disable body scroll when detail screen is open
  useEffect(() => {
    if (activeScreen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      // Stop Lenis smooth scroll
      document.body.setAttribute('data-lenis-stop', 'true')
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.removeAttribute('data-lenis-stop')
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.removeAttribute('data-lenis-stop')
    }
  }, [activeScreen])

  // Fetch detail screen data
  const fetchScreenData = async (screen) => {
    try {
      setLoading(true)
      let endpoint = ''
      switch(screen) {
        case 'customers':
          endpoint = '/admin/super-admin/customers'
          break
        case 'staff':
          endpoint = '/admin/super-admin/staff'
          break
        case 'restaurants':
          endpoint = '/admin/restaurants'
          break
        case 'orders':
          endpoint = '/admin/super-admin/orders'
          break
        case 'tables':
          endpoint = '/admin/super-admin/tables'
          break
        case 'subscriptions':
          navigate('/super-admin/subscriptions')
          setActiveScreen(null)
          return
        default:
          return
      }
      const response = await apiClient.get(endpoint)
      if (response.data.success) {
        setScreenData(response.data.data || [])
      }
    } catch (error) {
      console.error(`Failed to fetch ${screen} data:`, error)
    } finally {
      setLoading(false)
    }
  }

  // Open detail screen
  const openScreen = (screen) => {
    setActiveScreen(screen)
    setScreenFilter('all')
    setScreenSearch('')
    fetchScreenData(screen)
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full max-w-full">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 w-full">
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
            { label: 'Total Restaurants', value: stats.totalRestaurants, icon: Building2, color: 'bg-blue-500', trend: `${stats.activeRestaurants} active`, screen: 'restaurants' },
            { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-green-500', trend: `Across all cafes`, screen: 'customers' },
            { label: 'Total Staff', value: stats.totalStaff, icon: UserCheck, color: 'bg-orange-500', trend: `Admins & workers`, screen: 'staff' },
            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-purple-500', trend: `All time`, screen: 'revenue' },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => openScreen(stat.screen)}
                className="bg-white rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-all"
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
            { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingCart, color: 'bg-indigo-500', screen: 'orders' },
            { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: TrendingUp, color: 'bg-pink-500', screen: 'revenue' },
            { label: 'Active Orders', value: stats.activeOrders, icon: Activity, color: 'bg-red-500', screen: 'orders' },
            { label: 'Subscriptions', value: stats.totalSubscriptions || 0, icon: CreditCard, color: 'bg-cyan-500', screen: 'subscriptions' },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => openScreen(stat.screen)}
                className="bg-white rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all"
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
                  onClick={() => setActiveScreen('add-restaurant')}
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
                  <div 
                    key={restaurant.id} 
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRestaurant(restaurant)
                      setActiveScreen('restaurant-detail')
                      setEditMode(false)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                            {restaurant.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                            <p className="text-xs text-gray-500">{restaurant.subdomain}.yourdomain.com</p>
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
                            <p className="text-lg font-bold text-gray-900">{restaurant.stats?.tables || 0}</p>
                            <p className="text-xs text-gray-500">Tables</p>
                          </div>
                        </div>

                        {restaurant.address && (
                          <p className="text-xs text-gray-400 mt-2">{restaurant.address}</p>
                        )}
                      </div>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRestaurant(restaurant)
                          setActiveScreen('restaurant-detail')
                          setEditMode(false)
                        }}
                      >
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
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
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
            onClick={() => navigate('/super-admin/subscriptions')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
              <CreditCard size={24} className="text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Subscriptions</h3>
            <p className="text-sm text-gray-500 mt-1">Manage plans & revenue</p>
          </button>

          <button
            onClick={() => setActiveScreen('add-restaurant')}
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

      {/* Detail Screen - Full Page */}
      {activeScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-gray-50 z-40 overflow-x-hidden w-full max-w-full"
        >
          {/* Header */}
          <div className="bg-gray-900 text-white sticky top-0 z-10 w-full">
            <div className="max-w-7xl mx-auto px-4 py-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${
                    activeScreen === 'customers' ? 'bg-green-500' :
                    activeScreen === 'staff' ? 'bg-orange-500' :
                    activeScreen === 'restaurants' ? 'bg-blue-500' :
                    activeScreen === 'orders' ? 'bg-indigo-500' :
                    activeScreen === 'tables' ? 'bg-cyan-500' :
                    activeScreen === 'add-restaurant' ? 'bg-purple-500' :
                    activeScreen === 'restaurant-detail' ? 'bg-orange-500' : 'bg-purple-500'
                  } flex items-center justify-center`}>
                    {activeScreen === 'customers' && <Users size={20} className="text-white" />}
                    {activeScreen === 'staff' && <UserCheck size={20} className="text-white" />}
                    {activeScreen === 'restaurants' && <Building2 size={20} className="text-white" />}
                    {activeScreen === 'orders' && <ShoppingCart size={20} className="text-white" />}
                    {activeScreen === 'tables' && <Store size={20} className="text-white" />}
                    {activeScreen === 'add-restaurant' && <Plus size={20} className="text-white" />}
                    {activeScreen === 'restaurant-detail' && <Building2 size={20} className="text-white" />}
                    {activeScreen === 'revenue' && <DollarSign size={20} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {activeScreen === 'add-restaurant' ? 'Add Restaurant' : 
                       activeScreen === 'restaurant-detail' ? selectedRestaurant?.name : 
                       activeScreen}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {activeScreen === 'add-restaurant' ? 'Create new restaurant' : 
                       activeScreen === 'restaurant-detail' ? 'Manage restaurant details' :
                       `${screenData.length} total records`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveScreen(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6 w-full overflow-x-hidden">
            {/* Filters - Hidden for add-restaurant */}
            {activeScreen !== 'add-restaurant' && (
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 w-full">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder={`Search ${activeScreen}...`}
                      value={screenSearch}
                      onChange={(e) => setScreenSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>
                  {activeScreen === 'customers' && (
                    <select
                      value={screenFilter}
                      onChange={(e) => setScreenFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="all">All Cafes</option>
                      {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}
                  {activeScreen === 'staff' && (
                    <select
                      value={screenFilter}
                      onChange={(e) => setScreenFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  )}
                  {activeScreen === 'orders' && (
                    <select
                      value={screenFilter}
                      onChange={(e) => setScreenFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Data Grid or Form */}
            {activeScreen === 'restaurant-detail' && selectedRestaurant ? (
              <RestaurantDetailScreen 
                restaurant={selectedRestaurant}
                onBack={() => setActiveScreen(null)}
                onUpdate={(updated) => {
                  setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r))
                  setSelectedRestaurant(updated)
                }}
                onDelete={(id) => {
                  setRestaurants(prev => prev.filter(r => r.id !== id))
                  setActiveScreen(null)
                  setSelectedRestaurant(null)
                }}
              />
            ) : activeScreen === 'add-restaurant' ? (
              <AddRestaurant 
                onBack={() => setActiveScreen(null)}
                onSuccess={(newRestaurant) => {
                  // Add new restaurant to list instantly without closing screen
                  if (newRestaurant) {
                    setRestaurants(prev => [newRestaurant, ...prev])
                    setStats(prev => ({
                      ...prev,
                      totalRestaurants: prev.totalRestaurants + 1,
                      activeRestaurants: prev.activeRestaurants + 1
                    }))
                  }
                }}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden pb-20">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading...</p>
                  </div>
                ) : screenData.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">No {activeScreen} found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {screenData
                      .filter(item => {
                        if (!screenSearch) return true
                        const searchLower = screenSearch.toLowerCase()
                        return (
                          item.name?.toLowerCase().includes(searchLower) ||
                          item.email?.toLowerCase().includes(searchLower) ||
                          item.restaurant_name?.toLowerCase().includes(searchLower)
                        )
                      })
                      .filter(item => {
                        if (screenFilter === 'all') return true
                        if (activeScreen === 'customers') return item.restaurant_id === parseInt(screenFilter)
                        if (activeScreen === 'staff') return item.role === screenFilter
                        if (activeScreen === 'orders') return item.status === screenFilter
                        return true
                      })
                      .map((item, index) => (
                      <div key={item.id || index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {activeScreen === 'customers' && <Users size={18} className="text-gray-500" />}
                              {activeScreen === 'staff' && <UserCheck size={18} className="text-gray-500" />}
                              {activeScreen === 'restaurants' && <Building2 size={18} className="text-gray-500" />}
                              {activeScreen === 'orders' && <ShoppingCart size={18} className="text-gray-500" />}
                              {activeScreen === 'tables' && <Store size={18} className="text-gray-500" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.name || item.email || `Order #${item.id}`}</p>
                              <p className="text-sm text-gray-500">
                                {item.email && item.email !== item.name ? item.email : ''}
                                {item.restaurant_name && ` • ${item.restaurant_name}`}
                                {item.role && ` • ${item.role}`}
                                {item.status && ` • ${item.status}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {item.total_amount && <p className="font-semibold">{formatCurrency(item.total_amount)}</p>}
                            {item.is_active !== undefined && (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

