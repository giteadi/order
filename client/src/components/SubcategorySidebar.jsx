import { motion } from 'framer-motion'

export const SubcategorySidebar = ({ subcategories, selectedSubcategory, onSelectSubcategory }) => {
  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="w-64 flex-shrink-0 hidden lg:block"
    >
      <div className="sticky top-[200px] glass-card rounded-3xl p-4">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Categories</h3>
        <div className="grid gap-2">
          {subcategories?.map((sub) => (
            <motion.button
              key={sub.id}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectSubcategory(sub.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                selectedSubcategory === sub.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <span className="text-sm">{sub.name}</span>
                <span className="text-xs opacity-60">{sub.count}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.aside>
  )
}
