import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, QrCode, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const plan = location.state?.plan

  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentProof, setPaymentProof] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (!plan) {
      navigate('/pricing')
      return
    }
    initiateSubscription()
  }, [plan])

  const initiateSubscription = async () => {
    try {
      const response = await apiClient.post('/subscription/subscribe', { planId: plan.id })
      if (response.data.success) {
        setQrData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to initiate subscription:', error)
      toast.error('Failed to generate payment QR')
      navigate('/pricing')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setPaymentProof(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentProof) {
      toast.error('Please upload payment proof')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('planId', plan.id)
      formData.append('transactionId', qrData.transactionId)
      formData.append('paymentProof', paymentProof)

      const response = await apiClient.post('/subscription/payments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        toast.success('Payment proof submitted successfully')
        navigate('/subscription/history')
      }
    } catch (error) {
      console.error('Failed to submit payment:', error)
      toast.error('Failed to submit payment proof')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Generating payment QR...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/pricing')}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600">Scan QR and upload payment proof</p>
          </div>
        </div>

        {/* Plan Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name} Plan</h3>
              <p className="text-gray-600">₹{plan.price} / {plan.duration_months === 1 ? 'month' : plan.duration_months === 3 ? '3 months' : 'year'}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600">₹{qrData?.amount}</div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-6"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <QrCode size={16} />
              <span>Scan to Pay</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl inline-block mb-4 border-2 border-gray-100">
              {qrData?.qrCode && (
                <img 
                  src={qrData.qrCode} 
                  alt="Payment QR Code" 
                  className="w-64 h-64"
                />
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>UPI ID:</strong> 9516696009@ybl</p>
              <p><strong>Transaction ID:</strong> {qrData?.transactionId}</p>
              <p className="text-xs text-gray-500 mt-2">
                Please include this transaction ID in your payment note
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment Proof Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Payment Proof</h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
            <input
              type="file"
              id="paymentProof"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="paymentProof"
              className="cursor-pointer"
            >
              {previewUrl ? (
                <div>
                  <img 
                    src={previewUrl} 
                    alt="Payment proof preview" 
                    className="max-h-48 mx-auto mb-4 rounded-lg"
                  />
                  <p className="text-sm text-gray-600">Click to change</p>
                </div>
              ) : (
                <div>
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload screenshot</p>
                  <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              )}
            </label>
          </div>

          {paymentProof && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="text-sm">{paymentProof.name}</span>
            </div>
          )}
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Payment Verification</p>
            <p>After uploading, your payment will be verified by our team. You'll receive a notification once activated.</p>
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleSubmitPayment}
          disabled={!paymentProof || submitting}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Payment Proof'}
        </motion.button>
      </div>
    </div>
  )
}
