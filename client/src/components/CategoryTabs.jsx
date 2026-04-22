import { motion } from 'framer-motion'

export const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="sticky top-[120px] z-30 glass border-b border-white/10 overflow-x-auto"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
              selectedCategory === cat.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'glass-card hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
