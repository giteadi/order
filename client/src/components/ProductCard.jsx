import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export const ProductCard = ({ product, onAddToCart, onClick, onCursorHover }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-card rounded-3xl overflow-hidden cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => onCursorHover(true)}
      onMouseLeave={() => onCursorHover(false)}
    >
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-6xl">
        {product.image}
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white flex items-center justify-center"
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
