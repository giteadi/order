import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus } from 'lucide-react'

export const ProductModal = ({ isOpen, onClose, product, quantity, onQuantityChange, onAddToCart }) => {
  // SQLite stores booleans as 0/1 — use strict check
  const hasHalfPortion = product?.has_half_portion === 1 || product?.has_half_portion === true ||
                         product?.hasHalfPortion === 1 || product?.hasHalfPortion === true
  const halfPrice = product?.half_portion_price || product?.halfPortionPrice
  const fullPrice = product?.full_portion_price || product?.fullPortionPrice || product?.price

  const [selectedPortion, setSelectedPortion] = useState('full')

  // Reset portion when product changes
  useEffect(() => {
    setSelectedPortion('full')
    // Debug — remove after fix confirmed
    if (product) {
      console.log('[ProductModal] product data:', {
        name: product.name,
        has_half_portion: product.has_half_portion,
        hasHalfPortion: product.hasHalfPortion,
        half_portion_price: product.half_portion_price,
        full_portion_price: product.full_portion_price,
        hasHalfPortionResolved: product?.has_half_portion === 1 || product?.has_half_portion === true
      })
    }
  }, [product?.id])

  const displayPrice = hasHalfPortion
    ? (selectedPortion === 'half' ? halfPrice : fullPrice)
    : product?.price

  const handleAddToCart = () => {
    const productToAdd = hasHalfPortion
      ? { ...product, price: displayPrice, portion: selectedPortion }
      : product
    onAddToCart(productToAdd, quantity)
  }

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
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
                {(product.imageUrl || product.image_url || (product.image && product.image.startsWith('http'))) ? (
                  <img
                    src={product.imageUrl || product.image_url || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <span className="text-6xl sm:text-8xl">{product.emojiIcon || product.emoji_icon || product.image || '🍽️'}</span>
                )}
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

                {/* Half / Full Portion Selector */}
                {hasHalfPortion && (
                  <div className="mb-5">
                    <label className="text-xs sm:text-sm text-gray-500 mb-2 block">Portion Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPortion('half')}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          selectedPortion === 'half'
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Half — ₹{halfPrice}
                      </button>
                      <button
                        onClick={() => setSelectedPortion('full')}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          selectedPortion === 'full'
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Full — ₹{fullPrice}
                      </button>
                    </div>
                  </div>
                )}

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
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">₹{displayPrice * quantity}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
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
