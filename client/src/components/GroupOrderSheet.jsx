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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed left-0 right-0 bottom-0 z-50"
          >
            <div className="glass-card rounded-t-[28px] mx-auto max-w-3xl">
              <div className="px-6 pt-4 pb-6">
                <div className="flex items-center justify-between">
                  <div className="w-10" />
                  <div className="w-12 h-1.5 rounded-full bg-gray-300/60" />
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                  >
                    <X size={20} className="text-gray-900" />
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Order together with friends!
                  </h3>
                  <p className="text-gray-500 mt-2">
                    One bill, easy ordering
                  </p>
                </div>

                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onCreate}
                    className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold"
                  >
                    Invite & Create Group
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
