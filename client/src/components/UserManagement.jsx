import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Search, Users, Phone, Mail, Star,
  ShoppingBag, Calendar, TrendingUp, Download
} from 'lucide-react'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'

export const UserManagement = () => {
  const navigate = useNavigateWithParams()
  const user = useSelector((state) => state.auth.user)
  const userRole = user?.role || 'customer'

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('last_order') // last_order | total_orders | total_spent | name

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/admin/users/customers')
      if (response.data.success) {
        setCustomers(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Copy phone/email to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // small feedback — could use toast but keeping it simple
    })
  }

  // Export as CSV
  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent (₹)', 'Last Order', 'Joined'],
      ...filteredCustomers.map(c => [
        c.name || '',
        c.email || '',
        c.phone || '',
        c.total_orders || 0,
        c.total_spent || 0,
        c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('en-IN') : '',
        new Date(c.created_at).toLocaleDateString('en-IN'),
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCustomers = customers
    .filter(c => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'last_order') {
        return new Date(b.last_order_at || 0) - new Date(a.last_order_at || 0)
      }
      if (sortBy === 'total_orders') return (b.total_orders || 0) - (a.total_orders || 0)
      if (sortBy === 'total_spent') return (b.total_spent || 0) - (a.total_spent || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      return 0
    })

  const totalRevenue = customers.reduce((s, c) => s + (c.total_spent || 0), 0)
  const totalOrders = customers.reduce((s, c) => s + (c.total_orders || 0), 0)
  const repeatCustomers = customers.filter(c => (c.total_orders || 0) > 1).length

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
                <h1 className="text-xl font-bold">Customer Data</h1>
                <p className="text-sm text-gray-400">Registered customers for your restaurant</p>
              </div>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Customers</p>
                <p className="text-xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ShoppingBag size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Star size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Repeat Customers</p>
                <p className="text-xl font-bold text-gray-900">{repeatCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none bg-white text-sm"
          >
            <option value="last_order">Sort: Last Order</option>
            <option value="total_orders">Sort: Most Orders</option>
            <option value="total_spent">Sort: Most Spent</option>
            <option value="name">Sort: Name A-Z</option>
          </select>
        </div>

        {/* Customer Cards */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Users size={28} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? 'Try a different search' : 'Customers who register will appear here'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{filteredCustomers.length} customers</p>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Spent</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Visit</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {(c.name || c.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{c.name || '—'}</p>
                            {(c.total_orders || 0) > 1 && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                <Star size={10} className="fill-amber-400 text-amber-400" />
                                Repeat
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {c.email && (
                            <button
                              onClick={() => copyToClipboard(c.email)}
                              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 transition-colors group"
                              title="Click to copy"
                            >
                              <Mail size={12} className="text-gray-400 group-hover:text-blue-500" />
                              {c.email}
                            </button>
                          )}
                          {c.phone && (
                            <button
                              onClick={() => copyToClipboard(c.phone)}
                              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-green-600 transition-colors group"
                              title="Click to copy"
                            >
                              <Phone size={12} className="text-gray-400 group-hover:text-green-500" />
                              {c.phone}
                            </button>
                          )}
                          {!c.email && !c.phone && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900">{c.total_orders || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-gray-900">
                          {c.total_spent > 0 ? `₹${Number(c.total_spent).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.last_order_at
                          ? new Date(c.last_order_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(c.name || c.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">{c.name || 'No name'}</p>
                        {(c.total_orders || 0) > 1 && (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                            <Star size={10} className="fill-amber-400 text-amber-400" />
                            Repeat
                          </span>
                        )}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1 mt-1">
                          <Mail size={11} className="text-gray-400" />
                          <p className="text-xs text-gray-500 truncate">{c.email}</p>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-gray-400" />
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{c.total_orders || 0} orders</p>
                      {c.total_spent > 0 && (
                        <p className="text-xs text-gray-500">₹{Number(c.total_spent).toLocaleString('en-IN')}</p>
                      )}
                      {c.last_order_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(c.last_order_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
