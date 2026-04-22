import { motion } from 'framer-motion'
import { Search, ShoppingCart, Users } from 'lucide-react'

export const Header = ({ 
  tableNumber, 
  showSearch = true,
  onCartClick, 
  cartCount, 
  searchQuery, 
  onSearchChange,
  onGroupOrderClick,
  onCursorHover 
}) => {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 bg-white border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
            >
              ArtHaus Café
            </motion.div>
            <span className="text-sm text-gray-500">Table {tableNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            {onGroupOrderClick && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGroupOrderClick}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium"
              >
                <Users size={18} />
                Group Order
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
              className="relative p-2 rounded-full glass-card"
              onMouseEnter={() => onCursorHover(true)}
              onMouseLeave={() => onCursorHover(false)}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl glass-card outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-500/50"
            />
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
