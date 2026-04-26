import { useState, useEffect } from 'react'
import {
  ArrowLeft, Edit2, Power, XCircle, CheckCircle, Trash2,
  Users, Building2, ShoppingCart, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../services/api'

export const RestaurantDetailScreen = ({ restaurant, onBack, onUpdate, onDelete }) => {
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    subdomain: restaurant.subdomain || '',
    domain: restaurant.domain || '',
    description: restaurant.description || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    website: restaurant.website || '',
    is_active: restaurant.is_active ?? true
  })

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const response = await apiClient.patch(`/admin/restaurants/${restaurant.id}`, formData)
      if (response.data.success) {
        toast.success('Restaurant updated successfully!')
        onUpdate(response.data.data)
        setEditMode(false)
      } else {
        toast.error(response.data.message || 'Failed to update')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating restaurant')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will delete the restaurant and all associated data.')) return
    
    setLoading(true)
    try {
      const response = await apiClient.delete(`/admin/restaurants/${restaurant.id}`)
      if (response.data.success) {
        toast.success('Restaurant deleted successfully!')
        onDelete(restaurant.id)
      } else {
        toast.error(response.data.message || 'Failed to delete')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting restaurant')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      const response = await apiClient.patch(`/admin/restaurants/${restaurant.id}/status`, {
        is_active: !restaurant.is_active
      })
      if (response.data.success) {
        toast.success(`Restaurant ${!restaurant.is_active ? 'activated' : 'deactivated'}!`)
        onUpdate({ ...restaurant, is_active: !restaurant.is_active })
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const [tables, setTables] = useState([])
  const [tablesLoading, setTablesLoading] = useState(false)

  // Fetch tables for this restaurant
  useEffect(() => {
    const fetchTables = async () => {
      setTablesLoading(true)
      try {
        const response = await apiClient.get(`/admin/super-admin/tables`)
        if (response.data.success) {
          // Filter tables for this restaurant by name since API doesn't return restaurant_id
          const restaurantTables = response.data.data.filter(
            t => t.restaurant_name === restaurant.name
          )
          setTables(restaurantTables)
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error)
      } finally {
        setTablesLoading(false)
      }
    }
    fetchTables()
  }, [restaurant.id])

  return (
    <div className="h-full overflow-y-auto pb-20" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <span className="text-sm text-gray-500">Restaurant Details</span>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 size={18} />
                Edit
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  restaurant.is_active 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Power size={18} />
                {restaurant.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle size={18} />
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Restaurant Info Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
              {restaurant.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editMode ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none w-full"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  restaurant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {restaurant.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-500">ID: {restaurant.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
            {editMode ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-500">.localhost</span>
              </div>
            ) : (
              <p className="text-gray-900">{restaurant.subdomain}.localhost</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
            {editMode ? (
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g., menu.hotel.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{restaurant.domain || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {editMode ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{restaurant.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editMode ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{restaurant.email || '-'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            {editMode ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{restaurant.address || '-'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {editMode ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{restaurant.description || '-'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            {editMode ? (
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{restaurant.website || '-'}</p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Restaurant Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{restaurant.stats?.customers || 0}</p>
              <p className="text-sm text-gray-500">Customers</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{restaurant.stats?.staff || 0}</p>
              <p className="text-sm text-gray-500">Staff</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{restaurant.stats?.totalOrders || 0}</p>
              <p className="text-sm text-gray-500">Orders</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
              <p className="text-sm text-gray-500">Tables</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tables</h3>
              <p className="text-sm text-gray-500">{tables.length} tables configured</p>
            </div>
            <button
              onClick={() => window.open('/admin/tables', '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Manage Tables
            </button>
          </div>
        </div>

        {tablesLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tables...</p>
          </div>
        ) : tables.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium">No tables found</p>
            <p className="text-sm text-gray-400 mt-1">Add tables in Table Management</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => (
                <div 
                  key={table.id} 
                  className={`p-4 rounded-lg border-2 text-center ${
                    table.status === 'available' ? 'border-green-200 bg-green-50' :
                    table.status === 'occupied' ? 'border-red-200 bg-red-50' :
                    table.status === 'reserved' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className="text-2xl font-bold text-gray-900">{table.table_number}</p>
                  <p className="text-xs text-gray-500 mt-1">{table.capacity} seats</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    table.status === 'available' ? 'bg-green-100 text-green-700' :
                    table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                    table.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {table.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
