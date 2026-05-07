import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, X } from 'lucide-react'

const ProductImage = ({ product, className = '' }) => {
  const src = product.imageUrl || product.image_url || (product.image?.startsWith('http') ? product.image : null)
  const emoji = product.emojiIcon || product.emoji_icon || (!product.image?.startsWith('http') ? product.image : null) || '🍽️'

  if (src) {
    return (
      <img
        src={src}
        alt={product.name}
        className={`w-full h-full object-cover ${className}`}
        onError={(e) => { e.target.style.display = 'none' }}
      />
    )
  }
  return <span className="text-5xl md:text-6xl">{emoji}</span>
}

/**
 * Inline quick-add popup for half/full products.
 * Shows portion selector + quantity stepper without opening the full modal.
 */
const QuickAddPopup = ({ product, onClose, onAddToCart }) => {
  const halfPrice = product.half_portion_price || product.halfPortionPrice
  const fullPrice = product.full_portion_price || product.fullPortionPrice || product.price

  const [portion, setPortion] = useState('full')
  const [qty, setQty] = useState(1)

  const price = portion === 'half' ? halfPrice : fullPrice

  const handleAdd = (e) => {
    e.stopPropagation()
    onAddToCart({ ...product, price, portion }, qty)
    onClose(e)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
      >
        <X size={14} />
      </button>

      {/* Portion selector */}
      <p className="text-xs text-gray-500 mb-2 font-medium">Choose portion</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setPortion('half')}
          className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
            portion === 'half'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          Half — ₹{halfPrice}
        </button>
        <button
          onClick={() => setPortion('full')}
          className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
            portion === 'full'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          Full — ₹{fullPrice}
        </button>
      </div>

      {/* Quantity stepper */}
      <p className="text-xs text-gray-500 mb-2 font-medium">Quantity</p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center hover:bg-gray-200 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-base font-bold text-gray-900 w-4 text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center hover:bg-gray-200 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        <span className="text-sm font-bold text-gray-900">₹{price * qty}</span>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
      >
        Add to Cart
      </button>
    </motion.div>
  )
}

export const ProductCard = ({ product, onAddToCart, onClick, onCursorHover }) => {
  const hasHalf = product.has_half_portion === 1 || product.has_half_portion === true ||
                  product.hasHalfPortion === 1 || product.hasHalfPortion === true
  const halfPrice = product.half_portion_price || product.halfPortionPrice
  const fullPrice = product.full_portion_price || product.fullPortionPrice || product.price

  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const openQuickAdd = (e) => {
    e.stopPropagation()
    setShowQuickAdd(true)
  }

  const closeQuickAdd = (e) => {
    e?.stopPropagation()
    setShowQuickAdd(false)
  }

  return (
    <>
      {/* Desktop: Card View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="hidden sm:block glass-card rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group relative"
        onClick={onClick}
        onMouseEnter={() => onCursorHover(true)}
        onMouseLeave={() => onCursorHover(false)}
      >
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center overflow-hidden">
          <ProductImage product={product} className="rounded-t-2xl" />
        </div>
        <div className="p-4 md:p-6 relative">
          <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1">{product.name}</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{product.description}</p>

          {hasHalf ? (
            <div className="relative">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={openQuickAdd}
                  className="py-1.5 px-2 rounded-lg bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold transition-colors text-center"
                >
                  Half ₹{halfPrice}
                </button>
                <button
                  onClick={openQuickAdd}
                  className="py-1.5 px-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors text-center"
                >
                  Full ₹{fullPrice}
                </button>
              </div>
              <AnimatePresence>
                {showQuickAdd && (
                  <QuickAddPopup
                    product={product}
                    onClose={closeQuickAdd}
                    onAddToCart={onAddToCart}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
              <span className="text-lg md:text-xl font-bold text-gray-900">₹{product.price}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-900 text-white grid place-items-center shadow-lg"
              >
                <Plus size={18} />
              </motion.button>
            </div>
          )}
        </div>

        {/* Backdrop to close popup when clicking outside */}
        {showQuickAdd && (
          <div
            className="fixed inset-0 z-40"
            onClick={closeQuickAdd}
          />
        )}
      </motion.div>

      {/* Mobile: Compact List View */}
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        className="sm:hidden bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 relative"
        onClick={onClick}
      >
        <div className="flex items-center gap-3 p-3">
          <div className="w-14 h-14 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl grid place-items-center overflow-hidden">
            <ProductImage product={product} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
            {hasHalf ? (
              <p className="text-xs text-gray-500 mt-0.5">Half ₹{halfPrice} · Full ₹{fullPrice}</p>
            ) : (
              <span className="text-base font-bold text-gray-900 mt-1 block">₹{product.price}</span>
            )}
          </div>
          {hasHalf ? (
            <div className="relative flex-shrink-0">
              <button
                onClick={openQuickAdd}
                className="w-10 h-10 rounded-full bg-gray-900 text-white grid place-items-center active:scale-90 transition-transform"
              >
                <Plus size={20} />
              </button>
              <AnimatePresence>
                {showQuickAdd && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="fixed left-4 right-4 bottom-24 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={closeQuickAdd}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-sm font-semibold text-gray-900 mb-3">{product.name}</p>

                    {/* Portion selector */}
                    <p className="text-xs text-gray-500 mb-2 font-medium">Choose portion</p>
                    <MobileQuickAdd
                      product={product}
                      halfPrice={halfPrice}
                      fullPrice={fullPrice}
                      onClose={closeQuickAdd}
                      onAddToCart={onAddToCart}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
              className="w-10 h-10 rounded-full bg-gray-900 text-white grid place-items-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* Backdrop for mobile popup */}
        {showQuickAdd && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeQuickAdd}
          />
        )}
      </motion.div>
    </>
  )
}

/** Separate stateful component for mobile quick-add body (avoids hook-in-render issues) */
const MobileQuickAdd = ({ product, halfPrice, fullPrice, onClose, onAddToCart }) => {
  const [portion, setPortion] = useState('full')
  const [qty, setQty] = useState(1)
  const price = portion === 'half' ? halfPrice : fullPrice

  const handleAdd = (e) => {
    e.stopPropagation()
    onAddToCart({ ...product, price, portion }, qty)
    onClose(e)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setPortion('half')}
          className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
            portion === 'half'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          Half — ₹{halfPrice}
        </button>
        <button
          onClick={() => setPortion('full')}
          className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
            portion === 'full'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          Full — ₹{fullPrice}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-2 font-medium">Quantity</p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center"
          >
            <Minus size={14} />
          </button>
          <span className="text-base font-bold text-gray-900 w-4 text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center"
          >
            <Plus size={14} />
          </button>
        </div>
        <span className="text-sm font-bold text-gray-900">₹{price * qty}</span>
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold"
      >
        Add to Cart
      </button>
    </>
  )
}
