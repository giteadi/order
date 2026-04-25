import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export const ProductCard = ({ product, onAddToCart, onClick, onCursorHover }) => {
  return (
    <>
      {/* Desktop: Card View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="hidden sm:block glass-card rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group"
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

      {/* Mobile: Compact List View */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        className="sm:hidden bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50"
        onClick={onClick}
      >
        <div className="flex items-center gap-3 p-3">
          <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl grid place-items-center text-2xl">
            {product.image}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
            <span className="text-base font-bold text-gray-900 mt-1 block">₹{product.price}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="w-10 h-10 rounded-full bg-gray-900 text-white grid place-items-center flex-shrink-0 active:scale-90 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>
      </motion.div>
    </>
  )
}
