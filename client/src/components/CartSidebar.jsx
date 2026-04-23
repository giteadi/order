import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, X, Plus, Minus } from 'lucide-react'
import { useEffect } from 'react'

export const CartSidebar = ({ 
  isOpen, 
  onClose, 
  cart, 
  tableNumber, 
  onUpdateQuantity, 
  onRemoveItem, 
  cartTotal,
  onPlaceOrder 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-full sm:max-w-md bg-white z-[60] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Your Order
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="p-3 sm:p-4 bg-gray-100 rounded-xl">
                <p className="text-xs sm:text-sm text-gray-500">
                  Table Number
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {tableNumber}
                </p>
              </div>
            </div>

            {/* Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 min-h-0">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50 rounded-xl p-3 sm:p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-lg bg-gray-200 flex items-center justify-center text-2xl sm:text-lg flex-shrink-0">
                          {item.image}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            ₹{item.price}
                          </p>

                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Minus size={14} className="sm:w-3 sm:h-3" />
                            </button>

                            <span className="font-semibold text-sm sm:text-base min-w-[24px] text-center">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Plus size={14} className="sm:w-3 sm:h-3" />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                        >
                          <X size={18} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer (Always Visible) */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 sm:px-6 sm:pt-4 pb-safe shadow-lg safe-area-bottom">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm text-gray-500 uppercase font-medium">
                    Subtotal
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₹{cartTotal}
                  </span>
                </div>

                <motion.button
                  onClick={onPlaceOrder}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-black text-white font-semibold text-base sm:text-lg hover:bg-gray-800 transition-colors"
                >
                  Place Order
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}