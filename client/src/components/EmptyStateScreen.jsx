import { motion } from 'framer-motion'

export const EmptyStateScreen = ({ title, subtitle, ctaLabel, onCta, icon = '🍽️' }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl text-center"
      >
        <div className="mx-auto w-full max-w-md glass-card rounded-3xl p-10">
          <div className="text-7xl mb-6">{icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{subtitle}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCta}
            className="w-full py-3 rounded-2xl bg-orange-500 text-white font-semibold"
          >
            {ctaLabel}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
