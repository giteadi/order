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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md glass-card z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={24} className="text-gray-900" />
                </motion.button>
              </div>

              <div className="mb-4 p-4 glass rounded-2xl">
                <p className="text-sm text-gray-500">Table Number</p>
                <p className="text-2xl font-bold text-gray-900">{tableNumber}</p>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl">
                            {item.image}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">₹{item.price}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                              >
                                <Minus size={14} className="text-gray-900" />
                              </motion.button>
                              <span className="font-semibold text-gray-900">{item.quantity}</span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                              >
                                <Plus size={14} className="text-gray-900" />
                              </motion.button>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onRemoveItem(item.id)}
                            className="text-red-500"
                          >
                            <X size={18} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-xl font-bold text-gray-900">₹{cartTotal}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-2xl font-semibold"
                      onClick={onPlaceOrder}
                    >
                      Place Order
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
