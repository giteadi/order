import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authAPI } from '../services/api'

export const LoginScreen = ({ onLogin, onNavigateToRegister, onNavigateToForgot }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Detect if input is email or phone
      const isEmail = formData.email.includes('@')

      // Get restaurant from URL params
      const params = new URLSearchParams(window.location.search)
      const restaurant = params.get('restaurant')

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

      // Check for subscription errors
      const errorCode = error.response?.data?.code
      const errorMessage = error.response?.data?.message

      if (errorCode === 'SUBSCRIPTION_REQUIRED') {
        alert('Subscription required! Redirecting to pricing page...')
        // Get restaurant from URL params for pricing page
        const params = new URLSearchParams(window.location.search)
        const restaurant = params.get('restaurant')
        window.location.href = restaurant ? `/pricing?restaurant=${restaurant}` : '/pricing'
        return
      }

      if (errorCode === 'SUBSCRIPTION_EXPIRED') {
        alert('Your subscription has expired! Please renew to continue.')
        const params = new URLSearchParams(window.location.search)
        const restaurant = params.get('restaurant')
        window.location.href = restaurant ? `/pricing?restaurant=${restaurant}&expired=true` : '/pricing?expired=true'
        return
      }

      alert(errorMessage || 'Login failed. Please check your credentials.')
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

                        // Check for subscription errors
                        const errorCode = error.response?.data?.code
                        const errorMessage = error.response?.data?.message

                        if (errorCode === 'SUBSCRIPTION_REQUIRED') {
                          alert('Subscription required! Redirecting to pricing page...')
                          const params = new URLSearchParams(window.location.search)
                          const restaurant = params.get('restaurant')
                          window.location.href = restaurant ? `/pricing?restaurant=${restaurant}` : '/pricing'
                          return
                        }

                        if (errorCode === 'SUBSCRIPTION_EXPIRED') {
                          alert('Your subscription has expired! Please renew to continue.')
                          const params = new URLSearchParams(window.location.search)
                          const restaurant = params.get('restaurant')
                          window.location.href = restaurant ? `/pricing?restaurant=${restaurant}&expired=true` : '/pricing?expired=true'
                          return
                        }

                        alert(errorMessage || 'Google login failed. Please try again.')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    onError={() => {
                      console.error('Google Login Failed')
                      alert('Google login failed. Please try again.')
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
    </div>
  )
}
