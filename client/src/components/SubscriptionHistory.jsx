import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const SubscriptionHistory = () => {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await apiClient.get('/subscription/history')
      if (response.data.success) {
        setSubscriptions(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
      toast.error('Failed to load subscription history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle size={14} />
            Active
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
            <Clock size={14} />
            Pending
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            <XCircle size={14} />
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <AlertCircle size={14} />
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subscription History</h1>
            <p className="text-gray-600">View all your past and current subscriptions</p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No subscriptions yet</h3>
            <p className="text-gray-600 mb-6">Choose a plan to get started</p>
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              View Plans
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{sub.plan_name}</h3>
                      {getStatusBadge(sub.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900">₹{sub.price}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-900">{sub.duration_months} month{sub.duration_months > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(sub.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(sub.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {sub.status === 'pending' && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">
                          Payment verification in progress. You'll be notified once activated.
                        </p>
                      </div>
                    )}

                    {sub.verified_at && (
                      <div className="mt-4 text-xs text-gray-500">
                        Verified on {new Date(sub.verified_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
