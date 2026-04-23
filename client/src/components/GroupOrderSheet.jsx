import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export const GroupOrderSheet = ({ isOpen, onClose, onCreate }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none"
          >
            <div 
              className="glass-card rounded-3xl mx-auto max-w-md w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 sm:p-8">
                {/* Close Button */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 grid place-items-center transition-colors"
                  >
                    <X size={18} className="text-gray-900" />
                  </button>
                </div>

                {/* Content */}
                <div className="grid gap-4 text-center">
                  <div className="text-6xl sm:text-7xl">👥</div>
                  <div className="grid gap-3">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 px-4">
                      Order together with friends!
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500">
                      One bill, easy ordering
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid gap-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreate}
                    className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm sm:text-base shadow-lg"
                  >
                    Invite & Create Group
                  </motion.button>
                  
                  <button
                    onClick={onClose}
                    className="w-full py-3 text-sm sm:text-base text-gray-600 font-medium hover:text-gray-900 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
