import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Users, Copy, Check, ShoppingBag, Trash2 } from 'lucide-react'
import { useState } from 'react'

export const GroupOrderScreen = ({ 
  isOpen, 
  onClose, 
  groupCode,
  members = [],
  orders = {},
  onAddItem,
  onRemoveItem,
  onCheckout,
  currentUser
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(groupCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalAmount = Object.values(orders).reduce((sum, userOrders) => {
    return sum + userOrders.reduce((userSum, item) => userSum + (item.price * item.quantity), 0)
  }, 0)

  const totalItems = Object.values(orders).reduce((sum, userOrders) => {
    return sum + userOrders.reduce((userSum, item) => userSum + item.quantity, 0)
  }, 0)

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
            className="fixed right-0 top-0 h-full w-full sm:max-w-2xl glass-card z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-4">
                <div className="grid grid-flow-col auto-cols-max items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 grid place-items-center">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Group Order</h2>
                    <p className="text-xs sm:text-sm text-gray-500">{members.length} members</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-900" />
                </motion.button>
              </div>

              {/* Group Code */}
              <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-xs text-gray-500 mb-1">Share this code with friends</p>
                <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-wider">{groupCode}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopyCode}
                    className="grid grid-flow-col auto-cols-max items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-900 text-white text-xs sm:text-sm font-medium"
                  >
                    {copied ? (
                      <>
                        <Check size={14} />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Members & Orders */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4 sm:gap-6">
                {members.map((member) => {
                  const memberOrders = orders[member.id] || []
                  const memberTotal = memberOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                  const isCurrentUser = member.id === currentUser

                  return (
                    <motion.div
                      key={member.id}
                      layout
                      className={`glass-card rounded-2xl p-4 sm:p-5 ${isCurrentUser ? 'ring-2 ring-orange-500' : ''}`}
                    >
                      {/* Member Header */}
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 grid place-items-center text-white font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            {member.name}
                            {isCurrentUser && <span className="ml-2 text-xs text-orange-500">(You)</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {memberOrders.length} {memberOrders.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                        {memberTotal > 0 && (
                          <span className="text-base sm:text-lg font-bold text-gray-900">₹{memberTotal}</span>
                        )}
                      </div>

                      {/* Member's Orders */}
                      {memberOrders.length > 0 ? (
                        <div className="grid gap-2">
                          {memberOrders.map((item, idx) => (
                            <motion.div
                              key={idx}
                              layout
                              className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white/50"
                            >
                              <span className="text-xl sm:text-2xl">{item.image}</span>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">₹{item.price} × {item.quantity}</p>
                              </div>
                              <div className="grid grid-flow-col auto-cols-max items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                                {isCurrentUser && (
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onRemoveItem(member.id, idx)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-xs sm:text-sm">
                          No items added yet
                        </div>
                      )}

                      {/* Add Item Button - Only for current user */}
                      {isCurrentUser && (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onAddItem(member.id)}
                          className="w-full mt-3 py-2 sm:py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors grid grid-flow-col auto-cols-max place-items-center justify-center gap-2 text-xs sm:text-sm font-medium"
                        >
                          <Plus size={16} />
                          Add Item
                        </motion.button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Footer - Checkout */}
            {totalItems > 0 && (
              <div className="border-t border-gray-200 p-4 sm:p-6 bg-white/95 backdrop-blur safe-area-bottom">
                <div className="grid gap-3 sm:gap-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Total Items</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{totalItems} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-gray-500">Total Amount</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{totalAmount}</p>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onCheckout}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base shadow-lg grid grid-flow-col auto-cols-max place-items-center justify-center gap-2"
                  >
                    <ShoppingBag size={18} />
                    Place Group Order
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
