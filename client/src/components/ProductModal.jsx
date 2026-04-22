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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="glass-card rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-8xl">
                {product.image}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
                    <p className="text-gray-500">{product.description}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <X size={24} className="text-gray-900" />
                  </motion.button>
                </div>

                <div className="mb-6">
                  <label className="text-sm text-gray-500 mb-2 block">Quantity</label>
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-full glass-card flex items-center justify-center"
                    >
                      <Minus size={20} className="text-gray-900" />
                    </motion.button>
                    <span className="text-2xl font-bold text-gray-900">{quantity}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onQuantityChange(quantity + 1)}
                      className="w-12 h-12 rounded-full glass-card flex items-center justify-center"
                    >
                      <Plus size={20} className="text-gray-900" />
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-gray-900">₹{product.price * quantity}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAddToCart(product, quantity)}
                  className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-semibold"
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
