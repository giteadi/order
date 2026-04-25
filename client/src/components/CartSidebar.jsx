import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, X, Plus, Minus } from 'lucide-react'

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
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white z-[60] flex flex-col overflow-hidden"
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50 rounded-xl p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-lg">
                          {item.image}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            ₹{item.price}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"
                            >
                              <Minus size={12} />
                            </button>

                            <span className="font-semibold text-sm">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer (Always Visible) */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 pt-4 pb-24 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 uppercase">
                    Subtotal
                  </span>
                  <span className="text-xl font-bold">
                    ₹{cartTotal}
                  </span>
                </div>

                <motion.button
                  onClick={onPlaceOrder}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-xl bg-black text-white font-semibold"
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