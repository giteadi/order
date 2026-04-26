import { motion } from 'framer-motion'
import { Search, ShoppingCart, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import apiClient from '../services/api'

export const Header = ({ 
  tableNumber, 
  showSearch = true,
  onCartClick, 
  cartCount, 
  searchQuery, 
  onSearchChange,
  onGroupOrderClick,
  onCursorHover,
  variant = 'sticky',
  user = null
}) => {
  const navigate = useNavigate()
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&q=80')
  const [restaurantName, setRestaurantName] = useState('ArtHaus Café')

  // Fetch logo from settings
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        console.log('🔍 Fetching logo from settings...')
        const response = await apiClient.get('/admin/settings/public')
        console.log('✅ Settings response:', response.data)
        
        if (response.data.success) {
          const data = response.data.data
          if (data.logo_url) {
            console.log('✅ Logo found:', data.logo_url.substring(0, 50) + '...')
            setLogo(data.logo_url)
          }
          if (data.name) {
            console.log('✅ Restaurant name:', data.name)
            setRestaurantName(data.name)
          }
        }
      } catch (error) {
        console.log('⚠️ Failed to fetch logo:', error.message)
        console.log('Using default logo')
      }
    }
    fetchLogo()
  }, [])

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`${variant === 'overlay' ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-50 bg-white border-b border-gray-200`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src={logo}
              alt={`${restaurantName} Logo`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-sm sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent hidden sm:block">
                {restaurantName}
              </span>
              <span className="text-xs text-gray-500 sm:text-sm">Table {tableNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Button - Mobile */}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                className="md:hidden px-3 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium"
              >
                Admin
              </motion.button>
            )}
            
            {onGroupOrderClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onGroupOrderClick}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-xs font-medium"
              >
                <Users size={16} />
                <span className="hidden lg:inline">Group</span>
              </motion.button>
            )}

            {/* Admin Button - Desktop */}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                className="hidden md:flex px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                Admin
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
              className="relative p-2 rounded-full bg-gray-100 hidden lg:grid place-items-center"
              onMouseEnter={() => onCursorHover(true)}
              onMouseLeave={() => onCursorHover(false)}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gray-900 rounded-full text-white text-xs font-bold grid place-items-center">
                  {cartCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 sm:mt-3 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search food & drinks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 border-0 rounded-xl outline-none transition-all focus:ring-2 focus:ring-gray-900/10 focus:bg-white"
            />
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
