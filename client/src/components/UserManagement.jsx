import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Users, UserCheck, UserX, Shield, ChefHat, ShoppingBag, MoreVertical, Filter } from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'

export const UserManagement = () => {
  const navigate = useNavigateWithParams()
  const user = useSelector((state) => state.auth.user)
  const userRole = user?.role || 'customer'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/users')
      if (response.data.success) {
        setUsers(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole })
      setShowRoleModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  const handleStatusChange = async (userId, isActive) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { isActive })
      fetchUsers()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return Shield
      case 'admin': return Shield
      case 'staff': return ChefHat
      case 'customer': return ShoppingBag
      default: return Users
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700'
      case 'admin': return 'bg-blue-100 text-blue-700'
      case 'staff': return 'bg-orange-100 text-orange-700'
      case 'customer': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone?.includes(searchQuery)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  const roleStats = {
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    staff: users.filter(u => u.role === 'staff').length,
    admin: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    active: users.filter(u => u.is_active).length,
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
                <h1 className="text-xl font-bold">User Management</h1>
                <p className="text-sm text-gray-400">Manage users and their roles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className={`grid gap-4 mb-8 ${userRole === 'super_admin' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              {userRole === 'super_admin' ? 'Total Users' : 'Total Staff'}
            </p>
            <p className="text-2xl font-bold text-gray-900">{roleStats.total}</p>
          </div>
          {userRole === 'super_admin' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-2xl font-bold text-blue-600">{roleStats.customers}</p>
            </div>
          )}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Staff</p>
            <p className="text-2xl font-bold text-orange-600">{roleStats.staff}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{roleStats.active}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-700">Last Login</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role)
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {user.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{user.email || user.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            <RoleIcon size={12} />
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleStatusChange(user.id, !user.is_active)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              user.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.is_active ? (
                              <><UserCheck size={12} /> Active</>
                            ) : (
                              <><UserX size={12} /> Inactive</>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowRoleModal(true)
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={18} className="text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-sm"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Change Role</h2>
              <p className="text-sm text-gray-500 mt-1">
                For: {selectedUser.name || selectedUser.email}
              </p>
            </div>
            <div className="p-6 space-y-2">
              {['customer', 'staff', 'admin', 'super_admin'].map((role) => {
                const RoleIcon = getRoleIcon(role)
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(selectedUser.id, role)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      selectedUser.role === role
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <RoleIcon size={20} />
                    <span className="font-medium capitalize">{role.replace('_', ' ')}</span>
                    {selectedUser.role === role && <CheckCircle size={18} className="ml-auto" />}
                  </button>
                )
              })}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
