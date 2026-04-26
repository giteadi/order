import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  QrCode, Plus, Search, Download, Trash2, Edit2,
  CheckCircle, XCircle, Clock, Users, Building2,
  ArrowLeft, RefreshCw, Maximize2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const TablesManagement = () => {
  const navigate = useNavigate()
  const [tables, setTables] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(null)
  const [showQRModal, setShowQRModal] = useState(null)
  const [showBulkQRModal, setShowBulkQRModal] = useState(false)
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    capacity: 4,
    location: '',
    restaurantId: ''
  })
  const [editTable, setEditTable] = useState({
    capacity: 4,
    location: '',
    status: 'available'
  })
  const [bulkQRRange, setBulkQRRange] = useState({
    startTable: 1,
    endTable: 50,
    restaurantId: ''
  })

  // Fetch tables and restaurants
  const fetchData = async () => {
    try {
      setLoading(true)
      const [tablesRes, restaurantsRes] = await Promise.all([
        apiClient.get('/admin/super-admin/tables'),
        apiClient.get('/admin/restaurants')
      ])

      if (tablesRes.data.success) {
        setTables(tablesRes.data.data || [])
      }
      if (restaurantsRes.data.success) {
        setRestaurants(restaurantsRes.data.data || [])
        if (restaurantsRes.data.data?.length > 0 && !newTable.restaurantId) {
          setNewTable(prev => ({ ...prev, restaurantId: restaurantsRes.data.data[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create new table
  const handleCreateTable = async (e) => {
    e.preventDefault()
    try {
      const response = await apiClient.post('/admin/tables', {
        tableNumber: parseInt(newTable.tableNumber),
        capacity: parseInt(newTable.capacity),
        location: newTable.location,
        restaurantId: parseInt(newTable.restaurantId)
      })

      if (response.data.success) {
        setShowAddModal(false)
        setNewTable({ tableNumber: '', capacity: 4, location: '', restaurantId: restaurants[0]?.id || '' })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to create table:', error)
      alert('Failed to create table: ' + (error.response?.data?.message || error.message))
    }
  }

  // Edit table
  const handleEditTable = async (e) => {
    e.preventDefault()
    if (!showEditModal) return
    
    try {
      const response = await apiClient.patch(`/admin/tables/${showEditModal.id}`, {
        capacity: parseInt(editTable.capacity),
        location: editTable.location,
        status: editTable.status
      })

      if (response.data.success) {
        setShowEditModal(null)
        setEditTable({ capacity: 4, location: '', status: 'available' })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to edit table:', error)
      alert('Failed to edit table: ' + (error.response?.data?.message || error.message))
    }
  }

  // Delete table
  const handleDeleteTable = async (id) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return
    }
    
    try {
      const response = await apiClient.delete(`/admin/tables/${id}`)
      if (response.data.success) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to delete table:', error)
      alert('Failed to delete table: ' + (error.response?.data?.message || error.message))
    }
  }

  // Open edit modal
  const openEditModal = (table) => {
    setShowEditModal(table)
    setEditTable({
      capacity: table.capacity,
      location: table.location || '',
      status: table.status
    })
  }

  // Generate QR code URL with restaurant info
  const generateQRData = (table) => {
    const restaurant = restaurants.find(r => r.id === table.restaurant_id)
    const subdomain = restaurant?.subdomain || 'default'
    // Format: subdomain.localhost/table/tableNumber
    return {
      url: `${subdomain}.localhost/table/${table.table_number}`,
      data: `restaurant:${subdomain},table:${table.table_number}`,
      fullUrl: `http://${subdomain}.localhost:5173/table/${table.table_number}`
    }
  }

  // Download QR code as image (using QR API)
  const downloadQR = (table) => {
    const qrInfo = generateQRData(table)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrInfo.fullUrl)}`

    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `table-${table.table_number}-${qrInfo.url}.png`
    link.click()
  }

  // Update table status
  const updateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/admin/tables/${id}/status`, { status })
      fetchData()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number?.toString().includes(searchQuery) ||
                         table.location?.toLowerCase().includes(searchQuery.toLowerCase())
    // Fix: Compare both as numbers since API may return string IDs
    const matchesRestaurant = restaurantFilter === 'all' || parseInt(table.restaurant_id) === parseInt(restaurantFilter)
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter
    return matchesSearch && matchesRestaurant && matchesStatus
  })

  const getStatusIcon = (status) => {
    switch(status) {
      case 'available': return <CheckCircle size={18} className="text-green-500" />
      case 'occupied': return <Users size={18} className="text-red-500" />
      case 'reserved': return <Clock size={18} className="text-yellow-500" />
      case 'cleaning': return <RefreshCw size={18} className="text-blue-500" />
      default: return <XCircle size={18} className="text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-700'
      case 'occupied': return 'bg-red-100 text-red-700'
      case 'reserved': return 'bg-yellow-100 text-yellow-700'
      case 'cleaning': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <QrCode size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Table Management</h1>
                <p className="text-sm text-gray-400">QR-based table ordering system</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/super-admin')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tables', value: tables.length, icon: QrCode, color: 'bg-blue-500' },
            { label: 'Available', value: tables.filter(t => t.status === 'available').length, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'Occupied', value: tables.filter(t => t.status === 'occupied').length, icon: Users, color: 'bg-red-500' },
            { label: 'Reserved', value: tables.filter(t => t.status === 'reserved').length, icon: Clock, color: 'bg-yellow-500' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Add */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <select
                value={restaurantFilter}
                onChange={(e) => setRestaurantFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                <option value="all">All Restaurants</option>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkQRModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <QrCode size={18} />
                <span>Bulk QR</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={18} />
                <span>Add Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading tables...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <QrCode size={24} className="text-gray-400" />
              </div>
              <p className="text-lg font-medium">No tables found</p>
              <p className="text-sm text-gray-400 mt-1">Add your first table to get started</p>
            </div>
          ) : (
            filteredTables.map((table, index) => {
              const qrInfo = generateQRData(table)
              const restaurant = restaurants.find(r => r.id === table.restaurant_id)

              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-700">{table.table_number}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Table {table.table_number}</h3>
                          <p className="text-xs text-gray-500">{restaurant?.name || 'Unknown Restaurant'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(table.status)}
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${getStatusColor(table.status)}`}>
                          {table.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Capacity:</span>
                        <span className="font-medium">{table.capacity} seats</span>
                      </div>
                      {table.location && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">{table.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">QR Code:</span>
                        <span className="font-mono text-xs truncate max-w-[150px]">{table.qr_code}</span>
                      </div>
                    </div>

                    {/* QR Preview */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode size={16} className="text-gray-400" />
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">{qrInfo.url}</span>
                        </div>
                        <button
                          onClick={() => setShowQRModal(table)}
                          className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Maximize2 size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadQR(table)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => openEditModal(table)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Table</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant *</label>
                <select
                  required
                  value={newTable.restaurantId}
                  onChange={(e) => setNewTable({ ...newTable, restaurantId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.subdomain}.localhost)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="e.g., 1, 2, 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <select
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="2">2 seats</option>
                  <option value="4">4 seats</option>
                  <option value="6">6 seats</option>
                  <option value="8">8 seats</option>
                  <option value="12">12 seats</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="e.g., Near Window, Corner, etc."
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium">QR Code will be generated automatically</p>
                <p className="text-xs mt-1">Format: restaurant.localhost/table/{newTable.tableNumber || 'X'}</p>
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
                  Create Table
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Table {showEditModal.table_number}</h2>
                <button
                  onClick={() => setShowEditModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditTable} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editTable.status}
                  onChange={(e) => setEditTable({ ...editTable, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <select
                  value={editTable.capacity}
                  onChange={(e) => setEditTable({ ...editTable, capacity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="2">2 seats</option>
                  <option value="4">4 seats</option>
                  <option value="6">6 seats</option>
                  <option value="8">8 seats</option>
                  <option value="12">12 seats</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={editTable.location}
                  onChange={(e) => setEditTable({ ...editTable, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="e.g., Near Window, Corner, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* QR Preview Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
          >
            <div className="text-center">
              {(() => {
                const qrInfo = generateQRData(showQRModal)
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrInfo.fullUrl)}`
                const restaurant = restaurants.find(r => r.id === showQRModal.restaurant_id)

                return (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Table {showQRModal.table_number}</h3>
                    <p className="text-sm text-gray-500 mb-4">{restaurant?.name}</p>

                    <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
                      <img
                        src={qrUrl}
                        alt={`QR Code for Table ${showQRModal.table_number}`}
                        className="w-full max-w-[200px] mx-auto"
                      />
                    </div>

                    <p className="text-xs text-gray-400 mb-4 break-all">{qrInfo.fullUrl}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadQR(showQRModal)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download size={18} />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => setShowQRModal(null)}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk QR Generation Modal */}
      {showBulkQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Bulk QR Generation</h2>
                <button
                  onClick={() => setShowBulkQRModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant *</label>
                <select
                  required
                  value={bulkQRRange.restaurantId}
                  onChange={(e) => setBulkQRRange({ ...bulkQRRange, restaurantId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.subdomain}.localhost)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Table *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bulkQRRange.startTable}
                    onChange={(e) => setBulkQRRange({ ...bulkQRRange, startTable: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Table *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bulkQRRange.endTable}
                    onChange={(e) => setBulkQRRange({ ...bulkQRRange, endTable: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium">This will generate QR codes for tables {bulkQRRange.startTable} to {bulkQRRange.endTable}</p>
                <p className="text-xs mt-1">Total: {bulkQRRange.endTable - bulkQRRange.startTable + 1} QR codes</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkQRModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const restaurant = restaurants.find(r => r.id === bulkQRRange.restaurantId)
                    if (!restaurant) return

                    // Get network IP for mobile access
                    const networkIP = window.location.hostname === 'localhost' 
                      ? '192.168.31.140' // Update this to your actual network IP
                      : window.location.hostname
                    const port = window.location.port || '5173'

                    // Download all QR codes using query param instead of subdomain
                    for (let i = bulkQRRange.startTable; i <= bulkQRRange.endTable; i++) {
                      const qrInfo = {
                        url: `${networkIP}:${port}/table/${i}?restaurant=${restaurant.subdomain}`,
                        fullUrl: `http://${networkIP}:${port}/table/${i}?restaurant=${restaurant.subdomain}`
                      }
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrInfo.fullUrl)}`
                      
                      // Download with delay to prevent browser blocking
                      setTimeout(() => {
                        const link = document.createElement('a')
                        link.href = qrUrl
                        link.download = `table-${i}-${restaurant.subdomain}.png`
                        link.click()
                      }, (i - bulkQRRange.startTable) * 200)
                    }
                    
                    toast.success(`Generating ${bulkQRRange.endTable - bulkQRRange.startTable + 1} QR codes...`)
                    setShowBulkQRModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate & Download
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
