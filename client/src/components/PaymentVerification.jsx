import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Image as ImageIcon, AlertCircle } from 'lucide-react'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const PaymentVerification = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(null)

  useEffect(() => {
    fetchPendingPayments()
  }, [])

  const fetchPendingPayments = async () => {
    try {
      const response = await apiClient.get('/subscription/admin/payments/pending')
      if (response.data.success) {
        setPayments(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch pending payments:', error)
      toast.error('Failed to load pending payments')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPayment = async (subscriptionId) => {
    setVerifying(subscriptionId)
    try {
      const response = await apiClient.post(`/subscription/admin/payments/${subscriptionId}/verify`)
      if (response.data.success) {
        toast.success('Payment verified successfully')
        fetchPendingPayments()
      }
    } catch (error) {
      console.error('Failed to verify payment:', error)
      toast.error('Failed to verify payment')
    } finally {
      setVerifying(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading pending payments...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
          <p className="text-gray-600">Review and verify pending subscription payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                <p className="text-sm text-gray-500">Pending Payments</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{payments.reduce((sum, p) => sum + p.price, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Amount</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ImageIcon size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.filter(p => p.payment_proof).length}
                </p>
                <p className="text-sm text-gray-500">With Proof</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <CheckCircle size={64} className="mx-auto text-green-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending payments to verify</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{payment.user_name}</h3>
                        <p className="text-sm text-gray-500">{payment.user_email}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                        <Clock size={14} />
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Plan</p>
                        <p className="font-semibold text-gray-900">{payment.plan_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900">₹{payment.price}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Transaction ID</p>
                        <p className="font-semibold text-gray-900 text-xs">{payment.transaction_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Submitted</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {payment.payment_proof ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Payment Proof</p>
                        <img
                          src={payment.payment_proof}
                          alt="Payment proof"
                          className="max-w-full h-48 object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-800">No payment proof uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:w-48 flex lg:flex-col gap-2">
                    <button
                      onClick={() => handleVerifyPayment(payment.id)}
                      disabled={verifying === payment.id}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {verifying === payment.id ? (
                        'Verifying...'
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          Verify
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => window.open(payment.payment_proof, '_blank')}
                      disabled={!payment.payment_proof}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={18} />
                      View Proof
                    </button>
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
