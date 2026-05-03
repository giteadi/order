import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'
import toast from 'react-hot-toast'
import { useRazorpay } from '../hooks/useRazorpay'

export const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const planId = searchParams.get('plan')
  const restaurant = searchParams.get('restaurant') || localStorage.getItem('restaurant_subdomain')

  const user = useSelector((state) => state.auth.user)
  const { openPayment, scriptLoaded } = useRazorpay()

  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    if (!planId) {
      navigate('/subscription-catalog')
      return
    }
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      const response = await apiClient.get('/subscription/plans')
      if (response.data.success) {
        const selected = response.data.data.find(p => p.id === parseInt(planId))
        if (selected) {
          setPlan(selected)
        } else {
          toast.error('Plan not found')
          navigate('/subscription-catalog')
        }
      }
    } catch (err) {
      toast.error('Failed to load plan')
      navigate('/subscription-catalog')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!scriptLoaded) {
      toast.error('Payment gateway loading, please wait...')
      return
    }

    setPaying(true)
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await apiClient.post('/razorpay/create-order', { planId: plan.id })
      if (!orderRes.data.success) {
        toast.error('Failed to create payment order')
        return
      }

      const { orderId, amount } = orderRes.data.data

      // Step 2: Open Razorpay modal
      openPayment({
        amount,
        orderId,
        name: 'Vishnu Hastkala Kendra',
        description: `${plan.name} Plan - ${plan.duration_months === 1 ? '1 Month' : plan.duration_months === 3 ? '3 Months' : '1 Year'}`,
        email: user?.email || '',
        phone: user?.phone || '',

        onSuccess: async (razorpayResponse) => {
          try {
            // Step 3: Verify payment & activate subscription
            const verifyRes = await apiClient.post('/razorpay/verify', {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
              planId: plan.id,
            })

            if (verifyRes.data.success) {
              setActivated(true)
              toast.success('🎉 Subscription activated!')
              setTimeout(() => {
                const params = new URLSearchParams()
                if (restaurant) params.set('restaurant', restaurant)
                navigate(`/admin${params.toString() ? `?${params.toString()}` : ''}`)
              }, 2000)
            } else {
              toast.error('Payment verification failed. Contact support.')
            }
          } catch (err) {
            toast.error('Verification error. Contact support with payment ID: ' + razorpayResponse.razorpay_payment_id)
          } finally {
            setPaying(false)
          }
        },

        onFailure: (err) => {
          setPaying(false)
          if (err?.message !== 'Payment cancelled by user') {
            toast.error(err?.description || 'Payment failed. Please try again.')
          }
        },
      })

    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading plan details...</div>
      </div>
    )
  }

  if (activated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Activated!</h2>
          <p className="text-gray-600">Your subscription is now active. Redirecting to dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/subscription-catalog')}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600">Secure payment via Razorpay</p>
          </div>
        </div>

        {/* Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name} Plan</h3>
              <p className="text-gray-500 text-sm mt-1">
                {plan.duration_months === 1 ? '1 Month' : plan.duration_months === 3 ? '3 Months' : '1 Year'} access
              </p>
              {plan.features?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="text-right ml-4">
              <div className="text-3xl font-bold text-purple-600">₹{plan.price}</div>
              <div className="text-xs text-gray-400 mt-1">incl. taxes</div>
            </div>
          </div>
        </motion.div>

        {/* Pay Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handlePay}
          disabled={paying || !scriptLoaded}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {paying ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard size={22} />
              <span>Pay ₹{plan.price} Securely</span>
            </>
          )}
        </motion.button>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Secured by Razorpay · UPI · Cards · Net Banking · Wallets
        </p>

      </div>
    </div>
  )
}
