import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Home, Menu, ClipboardList, Receipt } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'menu', label: 'Menu', icon: Menu, path: '/menu' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, path: '/orders' },
  { id: 'pay', label: 'Pay Bill', icon: Receipt, path: '/pay' },
]

export const BottomNav = () => {
  const location = useLocation()
  const activeTab = location.pathname.replace('/', '') || 'home'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 safe-area-bottom shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-4 gap-1 py-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className="relative flex flex-col items-center justify-center py-1.5 px-2"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={`flex flex-col items-center gap-0.5 ${
                    isActive ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-orange-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
