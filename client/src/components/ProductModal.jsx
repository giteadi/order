import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus } from 'lucide-react'

export const ProductModal = ({ isOpen, onClose, product, quantity, onQuantityChange, onAddToCart }) => {
  return (
    <AnimatePresence>
      {isOpen && product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 pointer-events-none"
          >
            <div 
              className="glass-card rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center text-6xl sm:text-8xl">
                {product.image}
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-[1fr_auto] items-start gap-2 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
                    <p className="text-sm sm:text-base text-gray-500">{product.description}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0"
                  >
                    <X size={20} className="sm:w-6 sm:h-6 text-gray-900" />
                  </motion.button>
                </div>

                <div className="mb-6">
                  <label className="text-xs sm:text-sm text-gray-500 mb-2 block">Quantity</label>
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-card grid place-items-center"
                    >
                      <Minus size={18} className="sm:w-5 sm:h-5 text-gray-900" />
                    </motion.button>
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onQuantityChange(quantity + 1)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-card grid place-items-center"
                    >
                      <Plus size={18} className="sm:w-5 sm:h-5 text-gray-900" />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center mb-4">
                  <span className="text-xs sm:text-sm text-gray-500">Total</span>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{product.price * quantity}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAddToCart(product, quantity)}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base"
                >
                  Add to Cart
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
