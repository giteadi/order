import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight, X, Crown, Sparkles, Package, Check, AlertTriangle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export const LoginScreen = ({ onLogin, onNavigateToRegister, onNavigateToForgot }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [subModalType, setSubModalType] = useState('required') // 'required' or 'expired'
  const [plans, setPlans] = useState([])

  // Fetch plans when modal opens
  useEffect(() => {
    if (showSubModal) {
      fetchPlans()
    }
  }, [showSubModal])

  const fetchPlans = async () => {
    try {
      const response = await authAPI.getPlans?.() || fetch('/api/v1/subscription/plans').then(r => r.json())
      if (response.data?.success) {
        setPlans(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      // Default plans if API fails
      setPlans([
        { id: 1, name: 'Monthly', price: 300, duration_months: 1 },
        { id: 2, name: 'Quarterly', price: 800, duration_months: 3 },
        { id: 3, name: 'Yearly', price: 1999, duration_months: 12 }
      ])
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPlanIcon = (planName) => {
    if (planName?.toLowerCase().includes('yearly')) return <Crown className="w-6 h-6 text-yellow-500" />
    if (planName?.toLowerCase().includes('quarterly')) return <Sparkles className="w-6 h-6 text-purple-500" />
    return <Package className="w-6 h-6 text-blue-500" />
  }

  const handleViewPlans = () => {
    setShowSubModal(false)
    window.location.href = subModalType === 'expired' ? '/subscription-catalog?expired=true' : '/subscription-catalog'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Detect if input is email or phone
      const isEmail = formData.email.includes('@')

      // Get restaurant from URL params
      const params = new URLSearchParams(window.location.search)
      const restaurant = params.get('restaurant')

      // Save email/phone for payment page
      if (isEmail) {
        localStorage.setItem('user_email', formData.email)
      } else {
        localStorage.setItem('user_phone', formData.email)
      }

      const loginData = {
        password: formData.password,
        ...(isEmail ? { email: formData.email } : { phone: formData.email }),
        restaurant
      }

      console.log('Login data being sent:', loginData)

      const response = await authAPI.login(loginData)
      console.log('Full response:', response)
      console.log('Response data:', response.data)
      console.log('Response data.data:', response.data?.data)

      const { user, token, refreshToken } = response.data.data
      console.log('Extracted user:', user)
      console.log('User role:', user?.role)

      // Call parent onLogin with user data - parent will handle redirect
      onLogin?.({
        user,
        token,
        refreshToken,
      })
    } catch (error) {
      console.error('Login error:', error)

      // Check for subscription errors - backend sends data in error.response.data.errors
      const errorData = error.response?.data?.errors || error.response?.data?.data || error.response?.data
      const errorCode = errorData?.code
      const errorMessage = errorData?.message || error.response?.data?.message

      console.log('Error response:', error.response?.data)
      console.log('Error code:', errorCode)
      console.log('Error data:', errorData)

      if (errorCode === 'SUBSCRIPTION_REQUIRED') {
        setSubModalType('required')
        setShowSubModal(true)
        toast.error('Subscription required to access dashboard')
        return
      }

      if (errorCode === 'SUBSCRIPTION_EXPIRED') {
        setSubModalType('expired')
        setShowSubModal(true)
        toast.error('Your subscription has expired. Please renew to continue.')
        return
      }

      toast.error(errorMessage || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 sm:py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-8 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">☕</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-sm sm:text-base">Sign in to continue ordering</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Phone</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email or phone"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={onNavigateToForgot}
                className="text-sm font-medium text-gray-900 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="mt-4 space-y-3">
                {/* Google Login Button */}
                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      try {
                        setIsLoading(true)
                        // Get restaurant from URL params
                        const params = new URLSearchParams(window.location.search)
                        const restaurant = params.get('restaurant')
                        const response = await authAPI.googleLogin({
                          idToken: credentialResponse.credential,
                          restaurant
                        })
                        const { user, token, refreshToken } = response.data.data

                        // Call parent onLogin with user data - parent handles redirect
                        onLogin?.({
                          user,
                          token,
                          refreshToken,
                          isSocialLogin: true,
                        })
                      } catch (error) {
                        console.error('Google login error:', error)

                        // Check for subscription errors - backend sends data in error.response.data.errors
                        const errorData = error.response?.data?.errors || error.response?.data?.data || error.response?.data
                        const errorCode = errorData?.code
                        const errorMessage = errorData?.message || error.response?.data?.message

                        if (errorCode === 'SUBSCRIPTION_REQUIRED') {
                          setSubModalType('required')
                          setShowSubModal(true)
                          toast.error('Subscription required to access dashboard')
                          return
                        }

                        if (errorCode === 'SUBSCRIPTION_EXPIRED') {
                          setSubModalType('expired')
                          setShowSubModal(true)
                          toast.error('Your subscription has expired. Please renew to continue.')
                          return
                        }

                        toast.error(errorMessage || 'Google login failed. Please try again.')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    onError={() => {
                      console.error('Google Login Failed')
                      toast.error('Google login failed. Please try again.')
                    }}
                    useOneTap
                    theme="filled_black"
                    size="large"
                    width={400}
                  />
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="font-medium text-gray-900 hover:underline"
            >
              Sign up
            </button>
          </p>
        </motion.div>
      </div>

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {subModalType === 'expired' ? (
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {subModalType === 'expired' ? 'Subscription Expired' : 'Subscription Required'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {subModalType === 'expired'
                        ? 'Renew to continue using all features'
                        : 'Choose a plan to access your dashboard'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                {subModalType === 'expired'
                  ? 'Your previous subscription has expired. Select a new plan to continue managing your restaurant.'
                  : 'You need an active subscription to access the admin dashboard and manage orders.'}
              </p>

              {/* Plans List */}
              <div className="space-y-3 mb-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {getPlanIcon(plan.name)}
                      <div>
                        <p className="font-semibold text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-500">{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(plan.price)}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(Math.round(plan.price / plan.duration_months))}/mo
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Menu Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Order Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Table Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Analytics & Reports</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleViewPlans}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                View All Plans
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                You will be redirected to the subscription catalog to complete your purchase
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
