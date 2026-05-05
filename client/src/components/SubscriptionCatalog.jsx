import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, AlertTriangle, Package, Calendar, Shield, CreditCard } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'
import toast from 'react-hot-toast'
import { useRazorpay } from '../hooks/useRazorpay'

export const SubscriptionCatalog = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useSelector((state) => state.auth.user)
  const isExpired = searchParams.get('expired') === 'true'
  const restaurant = searchParams.get('restaurant') || localStorage.getItem('restaurant_subdomain')

  const { openPayment, scriptLoaded } = useRazorpay()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingPlanId, setPayingPlanId] = useState(null) // which plan is being paid

  const navigateWithRestaurant = (path) => {
    const params = new URLSearchParams()
    if (restaurant) params.set('restaurant', restaurant)
    navigate(`${path}${params.toString() ? `?${params.toString()}` : ''}`)
  }

  useEffect(() => {
    if (restaurant) localStorage.setItem('restaurant_subdomain', restaurant)
    fetchPlans()
    if (user) fetchCurrentSubscription()
  }, [user, restaurant])

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/subscription/plans')
      if (response.data.success) setPlans(response.data.data)
    } catch (error) {
      toast.error('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiClient.get('/subscription')
      if (response.data.success && response.data.data) {
        // Active subscription — go to dashboard
        const params = new URLSearchParams()
        if (restaurant) params.set('restaurant', restaurant)
        navigate(`/admin${params.toString() ? `?${params.toString()}` : ''}`)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  // Direct Razorpay on plan click
  const handleSelectPlan = async (plan) => {
    if (!scriptLoaded) {
      toast.error('Payment gateway loading, please wait...')
      return
    }

    setPayingPlanId(plan.id)
    try {
      // Create Razorpay order on backend
      const orderRes = await apiClient.post('/razorpay/create-order', { planId: plan.id })
      if (!orderRes.data.success) {
        toast.error('Failed to create payment order')
        setPayingPlanId(null)
        return
      }

      const { orderId, amount } = orderRes.data.data

      openPayment({
        amount,
        orderId,
        name: 'Vishnu Hastkala Kendra',
        description: `${plan.name} Plan - ${plan.duration_months === 1 ? '1 Month' : plan.duration_months === 3 ? '3 Months' : '1 Year'}`,
        email: user?.email || '',
        phone: user?.phone || '',

        onSuccess: async (razorpayResponse) => {
          try {
            const verifyRes = await apiClient.post('/razorpay/verify', {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
              planId: plan.id,
            })

            if (verifyRes.data.success) {
              toast.success('🎉 Subscription activated!')
              const params = new URLSearchParams()
              if (restaurant) params.set('restaurant', restaurant)
              navigate(`/admin${params.toString() ? `?${params.toString()}` : ''}`)
            } else {
              toast.error('Payment verification failed. Contact support.')
            }
          } catch (err) {
            toast.error('Verification error. Contact support.')
          } finally {
            setPayingPlanId(null)
          }
        },

        onFailure: (err) => {
          setPayingPlanId(null)
          if (err?.message !== 'Payment cancelled by user') {
            toast.error(err?.description || 'Payment failed. Please try again.')
          }
        },
      })
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setPayingPlanId(null)
    }
  }

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount)

  const getPlanIcon = (planName) => {
    if (planName.toLowerCase().includes('yearly')) return <Crown className="w-8 h-8 text-yellow-500" />
    if (planName.toLowerCase().includes('quarterly')) return <Sparkles className="w-8 h-8 text-purple-500" />
    return <Package className="w-8 h-8 text-blue-500" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.name || 'User'}</h1>
                <p className="text-sm text-gray-500">{user?.email || user?.phone}</p>
              </div>
            </div>
            <button
              onClick={() => navigateWithRestaurant('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {isExpired && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Subscription Expired</p>
              <p className="text-sm text-amber-700">Please choose a new plan to continue.</p>
            </div>
          </div>
        </motion.div>
      )}

      {!isExpired && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">Subscription Required</p>
              <p className="text-sm text-blue-700">Select a plan to access all features. Payment is instant via Razorpay.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Subscription Plan</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a plan and pay instantly. Your subscription activates immediately after payment.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const isPaying = payingPlanId === plan.id
            const isYearly = plan.name.toLowerCase().includes('yearly')

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isYearly ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {isYearly && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    BEST VALUE
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    {getPlanIcon(plan.name)}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                    <span className="text-gray-500"> / {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                  </div>

                  <div className="mb-6 text-sm">
                    <span className="text-gray-600">Just </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(Math.round(plan.price / plan.duration_months))}</span>
                    <span className="text-gray-600"> per month</span>
                  </div>

                  <div className="space-y-3 mb-8">
                    {['Full Menu Management', 'Order Processing System', 'Table Management', 'Analytics & Reports', 'QR Code Generation', 'Priority Support'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Direct Pay Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isPaying || !!payingPlanId}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                      isYearly
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg disabled:opacity-60'
                        : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60'
                    }`}
                  >
                    {isPaying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Opening Payment...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Pay {formatCurrency(plan.price)}</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-2">🔒 Secured by Razorpay</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Flexible Duration</h4>
            <p className="text-sm text-gray-600">Monthly, quarterly, or yearly plans</p>
          </div>
          <div className="p-6">
            <Shield className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Instant Activation</h4>
            <p className="text-sm text-gray-600">Subscription activates immediately after payment</p>
          </div>
          <div className="p-6">
            <Package className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Full Access</h4>
            <p className="text-sm text-gray-600">Complete access to all features</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionCatalog
