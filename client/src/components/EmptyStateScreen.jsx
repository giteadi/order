import { motion } from 'framer-motion'

export const EmptyStateScreen = ({ title, subtitle, ctaLabel, onCta, icon = '🍽️' }) => {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
      >
        <div className="mx-auto w-full max-w-md glass-card rounded-3xl p-8 sm:p-10">
          <div className="grid gap-6 text-center">
            <div className="text-6xl sm:text-7xl">{icon}</div>
            <div className="grid gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCta}
              className="w-full py-3 sm:py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm sm:text-base"
            >
              {ctaLabel}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
