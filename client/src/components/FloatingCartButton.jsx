import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'

export const FloatingCartButton = ({ cartCount, onClick }) => {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl z-40 flex items-center justify-center"
    >
      <ShoppingCart size={24} />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full text-white text-sm flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </motion.button>
  )
}
