import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, X } from 'lucide-react'

/* ─── Image renderer ─────────────────────────────────────────── */
const ProductImage = ({ product, className = '' }) => {
  const src =
    product.imageUrl ||
    product.image_url ||
    (product.image?.startsWith('http') ? product.image : null)
  const emoji =
    product.emojiIcon ||
    product.emoji_icon ||
    (!product.image?.startsWith('http') ? product.image : null) ||
    '🍽️'

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

/* ─── Shared portion+qty body (used in both desktop popup & mobile sheet) ── */
const PortionBody = ({ product, halfPrice, fullPrice, onClose, onAddToCart }) => {
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
      {/* Portion selector */}
      <p className="text-xs text-gray-500 mb-2 font-medium">Choose portion</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={(e) => { e.stopPropagation(); setPortion('half') }}
          className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
            portion === 'half'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          Half — ₹{halfPrice}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setPortion('full') }}
          className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
            portion === 'full'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700'
          }`}
        >
          Full — ₹{fullPrice}
        </button>
      </div>

      {/* Quantity */}
      <p className="text-xs text-gray-500 mb-2 font-medium">Quantity</p>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)) }}
            className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center active:scale-90 transition-transform"
          >
            <Minus size={15} />
          </button>
          <span className="text-lg font-bold text-gray-900 min-w-[1.5rem] text-center">{qty}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setQty(q => q + 1) }}
            className="w-9 h-9 rounded-full bg-gray-100 grid place-items-center active:scale-90 transition-transform"
          >
            <Plus size={15} />
          </button>
        </div>
        <span className="text-base font-bold text-gray-900">₹{price * qty}</span>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform"
      >
        Add to Cart — ₹{price * qty}
      </button>
    </>
  )
}

/* ─── Desktop inline popup (floats above card bottom) ─────────── */
const DesktopPopup = ({ product, halfPrice, fullPrice, onClose, onAddToCart }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.93, y: 6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.93, y: 6 }}
    transition={{ duration: 0.15 }}
    className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[60]"
    onClick={(e) => e.stopPropagation()}
  >
    <button
      onClick={onClose}
      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
    >
      <X size={14} />
    </button>
    <PortionBody
      product={product}
      halfPrice={halfPrice}
      fullPrice={fullPrice}
      onClose={onClose}
      onAddToCart={onAddToCart}
    />
  </motion.div>
)

/* ─── Mobile bottom sheet (portal-style fixed overlay) ────────── */
const MobileSheet = ({ product, halfPrice, fullPrice, onClose, onAddToCart }) => (
  <>
    {/* Backdrop */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-[80]"
      onClick={onClose}
    />
    {/* Sheet */}
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[90] p-5 pb-8 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle bar */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

      {/* Product name */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 flex-1 pr-4">{product.name}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center flex-shrink-0"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      <PortionBody
        product={product}
        halfPrice={halfPrice}
        fullPrice={fullPrice}
        onClose={onClose}
        onAddToCart={onAddToCart}
      />
    </motion.div>
  </>
)

/* ─── Main ProductCard ─────────────────────────────────────────── */
export const ProductCard = ({ product, onAddToCart, onClick, onCursorHover }) => {
  const hasHalf =
    product.has_half_portion === 1 || product.has_half_portion === true ||
    product.hasHalfPortion === 1 || product.hasHalfPortion === true

  const halfPrice = product.half_portion_price || product.halfPortionPrice
  const fullPrice = product.full_portion_price || product.fullPortionPrice || product.price

  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const openQuickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowQuickAdd(true)
  }

  const closeQuickAdd = (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    setShowQuickAdd(false)
  }

  const safeHover = onCursorHover || (() => {})

  return (
    <>
      {/* ── DESKTOP card (sm and above) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="hidden sm:block glass-card rounded-2xl md:rounded-3xl overflow-visible cursor-pointer group relative"
        onClick={onClick}
        onMouseEnter={() => safeHover(true)}
        onMouseLeave={() => safeHover(false)}
      >
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center overflow-hidden rounded-t-2xl md:rounded-t-3xl">
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
                  <DesktopPopup
                    product={product}
                    halfPrice={halfPrice}
                    fullPrice={fullPrice}
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

        {/* Desktop backdrop */}
        {showQuickAdd && (
          <div className="fixed inset-0 z-[55]" onClick={closeQuickAdd} />
        )}
      </motion.div>

      {/* ── MOBILE card (below sm) ── */}
      <div className="sm:hidden bg-white rounded-xl shadow-sm border border-gray-100">
        <div
          className="flex items-center gap-3 p-3 cursor-pointer active:bg-gray-50 transition-colors"
          onClick={onClick}
        >
          {/* Thumbnail */}
          <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl grid place-items-center overflow-hidden">
            <ProductImage product={product} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
            {hasHalf ? (
              <p className="text-xs text-gray-500 mt-1">
                Half ₹{halfPrice} · Full ₹{fullPrice}
              </p>
            ) : (
              <span className="text-sm font-bold text-gray-900 mt-1 block">₹{product.price}</span>
            )}
          </div>

          {/* Action button — stopPropagation so card click doesn't fire */}
          {hasHalf ? (
            <button
              onClick={openQuickAdd}
              className="w-10 h-10 rounded-full bg-gray-900 text-white grid place-items-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
              className="w-10 h-10 rounded-full bg-gray-900 text-white grid place-items-center flex-shrink-0 active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet — rendered outside card so no overflow/z-index issues */}
      <AnimatePresence>
        {showQuickAdd && (
          <MobileSheet
            product={product}
            halfPrice={halfPrice}
            fullPrice={fullPrice}
            onClose={closeQuickAdd}
            onAddToCart={onAddToCart}
          />
        )}
      </AnimatePresence>
    </>
  )
}
