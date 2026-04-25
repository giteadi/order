import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Store, Clock, Phone, Mail, MapPin, Image as ImageIcon, DollarSign, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import apiClient from '../services/api'

export const RestaurantSettings = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [settings, setSettings] = useState({
    name: 'ArtHaus Café',
    description: 'A cozy café serving specialty coffee and artisanal food',
    address: '123 Coffee Street, Bean City',
    phone: '+91 98765 43210',
    email: 'hello@arthaus.com',
    website: 'https://arthaus.com',
    opening_hours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '23:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '09:00', close: '21:00', closed: false },
    },
    logo_url: '',
    tax_rate: 5,
    currency: 'INR',
    currency_symbol: '₹',
    payment_methods: {
      cash: true,
      card: true,
      upi: true,
      wallet: false,
    },
    features: {
      table_reservation: true,
      online_ordering: true,
      delivery: false,
      takeaway: true,
    },
  })

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/admin/settings')
        if (response.data.success) {
          setSettings(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await apiClient.put('/admin/settings', settings)
      if (response.data.success) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDay = (day) => {
    setSettings({
      ...settings,
      opening_hours: {
        ...settings.opening_hours,
        [day]: {
          ...settings.opening_hours[day],
          closed: !settings.opening_hours[day].closed,
        },
      },
    })
  }

  const handleTimeChange = (day, field, value) => {
    setSettings({
      ...settings,
      opening_hours: {
        ...settings.opening_hours,
        [day]: {
          ...settings.opening_hours[day],
          [field]: value,
        },
      },
    })
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

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
                <h1 className="text-xl font-bold">Restaurant Settings</h1>
                <p className="text-sm text-gray-400">Manage your restaurant configuration</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Store className="text-gray-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="text-gray-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Logo</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon size={32} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Logo URL"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter a URL for your restaurant logo (recommended size: 200x200px)
                </p>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-gray-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Opening Hours</h2>
            </div>

            <div className="space-y-3">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-4 py-2">
                  <div className="w-24">
                    <span className="font-medium text-gray-700 capitalize">{day}</span>
                  </div>
                  <button
                    onClick={() => handleToggleDay(day)}
                    className={`p-2 rounded-lg transition-colors ${
                      settings.opening_hours[day].closed
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}
                  >
                    {settings.opening_hours[day].closed ? (
                      <ToggleLeft size={24} />
                    ) : (
                      <ToggleRight size={24} />
                    )}
                  </button>
                  {settings.opening_hours[day].closed ? (
                    <span className="text-gray-500">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={settings.opening_hours[day].open}
                        onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:outline-none"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={settings.opening_hours[day].close}
                        onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Tax */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="text-gray-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Payment & Tax</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currency_symbol}
                  onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Accepted Payment Methods
              </label>
              <div className="flex flex-wrap gap-4">
                {Object.entries(settings.payment_methods).map(([method, enabled]) => (
                  <button
                    key={method}
                    onClick={() => setSettings({
                      ...settings,
                      payment_methods: {
                        ...settings.payment_methods,
                        [method]: !enabled,
                      },
                    })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      enabled
                        ? 'bg-green-100 border-green-200 text-green-700'
                        : 'bg-gray-100 border-gray-200 text-gray-500'
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="capitalize">{method}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <ToggleRight className="text-gray-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Features</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(settings.features).map(([feature, enabled]) => (
                <button
                  key={feature}
                  onClick={() => setSettings({
                    ...settings,
                    features: {
                      ...settings.features,
                      [feature]: !enabled,
                    },
                  })}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    enabled
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium text-gray-900 capitalize">
                    {feature.replace('_', ' ')}
                  </span>
                  {enabled ? (
                    <ToggleRight size={24} className="text-green-600" />
                  ) : (
                    <ToggleLeft size={24} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
