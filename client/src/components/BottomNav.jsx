import { motion } from 'framer-motion'
import { Home, Menu, ClipboardList, Receipt } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'menu', label: 'Menu', icon: Menu },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'pay', label: 'Pay Bill', icon: Receipt },
]

export const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center py-2"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[11px] font-medium">{tab.label}</span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-orange-500"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
