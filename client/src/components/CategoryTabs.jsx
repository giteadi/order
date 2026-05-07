import { motion } from 'framer-motion'

// Simplified filters — All, Drinks, Food, Combos
const SIMPLE_CATEGORIES = [
  { id: 'all', name: 'All Items', icon: '🍽️' },
  { id: 'drinks', name: 'Drinks', icon: '🥤' },
  { id: 'food', name: 'Food', icon: '🍛' },
  { id: 'combos', name: 'Combos', icon: '🍱' },
]

export const CategoryTabs = ({ categories, selectedCategory, onSelectCategory }) => {
  // Use simplified categories instead of all categories
  const displayCategories = SIMPLE_CATEGORIES

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="sticky top-[110px] z-30 bg-white border-b border-gray-100 overflow-x-auto"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex gap-2">
          {displayCategories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 sm:px-5 py-2 rounded-full whitespace-nowrap text-sm sm:text-base font-medium transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
              <span className="sm:hidden">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
