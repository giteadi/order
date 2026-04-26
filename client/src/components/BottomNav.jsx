import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Home, Menu, ClipboardList, Receipt, User as UserIcon, LogOut } from 'lucide-react'
import { useSelector } from 'react-redux'
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice'

const tabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'menu', label: 'Menu', icon: Menu, path: '/menu' },
  { id: 'orders', label: 'Orders', icon: ClipboardList, path: '/orders' },
]

export const BottomNav = () => {
  const location = useLocation()
  const activeTab = location.pathname.replace('/', '') || 'home'
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Preserve query params during navigation
  const getPathWithParams = (path) => {
    return location.search ? `${path}${location.search}` : path
  }

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
                to={getPathWithParams(tab.path)}
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

          {/* Profile Tab - Show user avatar if logged in */}
          {isAuthenticated && user ? (
            <Link
              to={getPathWithParams('/profile')}
              className="relative flex flex-col items-center justify-center py-1.5 px-2"
            >
              {user.avatarBase64 || user.avatarUrl ? (
                <img 
                  src={user.avatarBase64 || user.avatarUrl} 
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border-2 border-orange-500"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-500 grid place-items-center">
                  <UserIcon size={14} className="text-white" />
                </div>
              )}
              <span className="text-[10px] font-medium leading-tight text-orange-500 mt-0.5">
                {user.name.split(' ')[0]}
              </span>
              {activeTab === 'profile' && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-orange-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          ) : (
            <Link
              to={getPathWithParams('/login')}
              className="relative flex flex-col items-center justify-center py-1.5 px-2"
            >
              <motion.div
                animate={{ scale: activeTab === 'login' ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`flex flex-col items-center gap-0.5 ${
                  activeTab === 'login' ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <UserIcon size={22} strokeWidth={activeTab === 'login' ? 2.5 : 2} />
                <span className="text-[10px] font-medium leading-tight">Profile</span>
              </motion.div>
              {activeTab === 'login' && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-orange-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
