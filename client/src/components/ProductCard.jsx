import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

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

export const ProductCard = ({ product, onAddToCart, onClick, onCursorHover }) => {
  const hasHalf = product.has_half_portion || product.hasHalfPortion
  const halfPrice = product.half_portion_price || product.halfPortionPrice
  const fullPrice = product.full_portion_price || product.fullPortionPrice || product.price

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
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 grid place-items-center overflow-hidden">
          <ProductImage product={product} className="rounded-t-2xl" />
        </div>
        <div className="p-4 md:p-6">
          <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-1">{product.name}</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">{product.description}</p>

          {hasHalf ? (
            /* Half / Full price display */
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart({ ...product, price: halfPrice, portion: 'half' }) }}
                  className="py-1.5 px-2 rounded-lg bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-semibold transition-colors text-center"
                >
                  Half ₹{halfPrice}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart({ ...product, price: fullPrice, portion: 'full' }) }}
                  className="py-1.5 px-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors text-center"
                >
                  Full ₹{fullPrice}
                </button>
              </div>
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
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart({ ...product, price: halfPrice, portion: 'half' }) }}
                className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold"
              >
                H+
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCart({ ...product, price: fullPrice, portion: 'full' }) }}
                className="px-2 py-1 rounded-lg bg-gray-900 text-white text-xs font-semibold"
              >
                F+
              </button>
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
      </motion.div>
    </>
  )
}
