import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, ArrowRight, AlertTriangle, Package, Calendar, Shield } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const SubscriptionCatalog = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useSelector((state) => state.auth.user)
  const isExpired = searchParams.get('expired') === 'true'
  const restaurant = searchParams.get('restaurant') || localStorage.getItem('restaurant_subdomain')

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Helper to navigate with restaurant parameter
  const navigateWithRestaurant = (path) => {
    const params = new URLSearchParams()
    if (restaurant) {
      params.set('restaurant', restaurant)
    }
    const queryString = params.toString()
    navigate(`${path}${queryString ? `?${queryString}` : ''}`)
  }

  useEffect(() => {
    // Save restaurant to localStorage if present
    if (restaurant) {
      localStorage.setItem('restaurant_subdomain', restaurant)
    }
    fetchPlans()
    if (user) {
      fetchCurrentSubscription()
    }
  }, [user, restaurant])

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/subscription/plans')
      if (response.data.success) {
        setPlans(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiClient.get('/subscription')
      if (response.data.success && response.data.data) {
        // Active subscription hai — directly admin dashboard pe bhejo
        const params = new URLSearchParams()
        if (restaurant) params.set('restaurant', restaurant)
        navigate(`/admin${params.toString() ? `?${params.toString()}` : ''}`)
        return
      }
      setCurrentSubscription(response.data.data)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const handleSelectPlan = (plan) => {
    if (currentSubscription) {
      toast.error('You already have an active subscription')
      return
    }
    setSelectedPlan(plan)
    setShowConfirmModal(true)
  }

  const handleProceedToPayment = () => {
    if (!selectedPlan) return
    const params = new URLSearchParams()
    params.set('plan', selectedPlan.id)
    if (restaurant) {
      params.set('restaurant', restaurant)
    }
    navigate(`/payment?${params.toString()}`)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

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

      {/* Alert Banner */}
      {isExpired && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200"
        >
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Subscription Expired</p>
                <p className="text-sm text-amber-700">Your previous subscription has expired. Please choose a new plan to continue.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!isExpired && !currentSubscription && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border-b border-blue-200"
        >
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Subscription Required</p>
                <p className="text-sm text-blue-700">Please select a subscription plan to access all features.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Subscription Plan</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your restaurant. All plans include full access to our ordering system, menu management, and analytics.
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Active Subscription</h3>
                  <p className="text-green-700">
                    {currentSubscription.plan_name} - Valid until {new Date(currentSubscription.end_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.name.toLowerCase().includes('yearly') ? 'ring-2 ring-yellow-400' : ''
              } ${currentSubscription ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {/* Popular Badge */}
              {plan.name.toLowerCase().includes('yearly') && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  BEST VALUE
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-6">
                  {getPlanIcon(plan.name)}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.duration_months} Month{plan.duration_months > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                  <span className="text-gray-500"> / {plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</span>
                </div>

                {/* Per Month Price */}
                <div className="mb-6 text-sm">
                  <span className="text-gray-600">Just </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(Math.round(plan.price / plan.duration_months))}
                  </span>
                  <span className="text-gray-600"> per month</span>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Full Menu Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Order Processing System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Table Management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Analytics & Reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">QR Code Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Priority Support</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={currentSubscription !== null}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    currentSubscription
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : plan.name.toLowerCase().includes('yearly')
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 shadow-lg'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentSubscription ? 'Already Subscribed' : 'Select Plan'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Flexible Duration</h4>
            <p className="text-sm text-gray-600">Choose from monthly, quarterly, or yearly plans based on your needs</p>
          </div>
          <div className="p-6">
            <Shield className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Secure Payment</h4>
            <p className="text-sm text-gray-600">All payments are secure and verified by our team</p>
          </div>
          <div className="p-6">
            <Package className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Full Access</h4>
            <p className="text-sm text-gray-600">Get complete access to all features with any subscription plan</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Plan Selection</h3>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{selectedPlan.name}</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedPlan.price)}</span>
              </div>
              <p className="text-sm text-gray-500">{selectedPlan.duration_months} Month{selectedPlan.duration_months > 1 ? 's' : ''}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <span className="font-semibold">✅ Instant Activation:</span> Your subscription will be activated immediately after payment via Razorpay.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedPlan(null)
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToPayment}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                Proceed to Payment
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionCatalog
