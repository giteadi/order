import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/api'
import toast from 'react-hot-toast'

export const PricingPage = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [currentSubscription, setCurrentSubscription] = useState(null)

  useEffect(() => {
    fetchPlans()
    fetchCurrentSubscription()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await apiClient.get('/subscription/plans')
      if (response.data.success) {
        setPlans(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiClient.get('/subscription')
      if (response.data.success) {
        setCurrentSubscription(response.data.data)
      }
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
    navigate('/payment', { state: { plan } })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading plans...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4"
          >
            <Sparkles size={16} />
            <span>Choose Your Plan</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees.
          </p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Crown className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Active Subscription</h3>
                <p className="text-sm text-green-700">
                  {currentSubscription.plan_name} • Valid until {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/subscription/history')}
              className="text-green-700 hover:text-green-900 font-medium text-sm"
            >
              View History →
            </button>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isYearly = plan.duration_months === 12
            const isQuarterly = plan.duration_months === 3
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-3xl p-8 ${
                  isYearly
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-2xl scale-105'
                    : 'bg-white shadow-lg'
                }`}
              >
                {isYearly && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                    🔥 Best Value
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">₹{plan.price}</span>
                  <span className={`text-lg ${isYearly ? 'text-purple-200' : 'text-gray-500'}`}>
                    /{plan.duration_months === 1 ? 'month' : plan.duration_months === 3 ? '3 months' : 'year'}
                  </span>
                </div>

                {isYearly && (
                  <div className="bg-purple-500/30 rounded-lg p-3 mb-6 text-sm">
                    Save ₹{300 * 12 - plan.price} compared to monthly
                  </div>
                )}

                {isQuarterly && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm text-blue-700">
                    Save ₹{300 * 3 - plan.price} compared to monthly
                  </div>
                )}

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check 
                        size={20} 
                        className={isYearly ? 'text-purple-200 flex-shrink-0 mt-0.5' : 'text-green-500 flex-shrink-0 mt-0.5'} 
                      />
                      <span className={isYearly ? 'text-purple-100' : 'text-gray-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={!!currentSubscription}
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    isYearly
                      ? 'bg-white text-purple-700 hover:bg-purple-50'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${currentSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {currentSubscription ? 'Already Subscribed' : (
                    <span className="flex items-center justify-center gap-2">
                      Get Started <ArrowRight size={18} />
                    </span>
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Check size={20} className="text-green-500" />
              <span>Secure UPI Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={20} className="text-green-500" />
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={20} className="text-green-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
