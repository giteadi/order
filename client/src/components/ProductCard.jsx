import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export const ProductCard = ({ product, onAddToCart, onClick, onCursorHover }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-card rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => onCursorHover(true)}
      onMouseLeave={() => onCursorHover(false)}
    >
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center text-5xl md:text-6xl">
        {product.image}
      </div>
      <div className="p-4 md:p-6">
        <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1">{product.name}</h3>
        <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{product.description}</p>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <span className="text-lg md:text-xl font-bold text-gray-900">₹{product.price}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-900 text-white grid place-items-center shadow-lg"
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
