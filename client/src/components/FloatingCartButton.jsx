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
      className="lg:hidden fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg z-50 flex items-center justify-center"
    >
      <ShoppingCart size={22} />
      {cartCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-blue-600 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md"
        >
          {cartCount}
        </motion.span>
      )}
    </motion.button>
  )
}
