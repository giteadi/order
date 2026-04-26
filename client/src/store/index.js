import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'

import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import menuReducer from './slices/menuSlice'
import orderReducer from './slices/orderSlice'
import uiReducer from './slices/uiSlice'
import restaurantReducer from './slices/restaurantSlice'

// Custom localStorage wrapper for Vite compatibility
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null)
    },
    setItem(_key, value) {
      return Promise.resolve(value)
    },
    removeItem(_key) {
      return Promise.resolve()
    },
  }
}

const storage = typeof window !== 'undefined' 
  ? {
      getItem: (key) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key, value) => {
        localStorage.setItem(key, value)
        return Promise.resolve()
      },
      removeItem: (key) => {
        localStorage.removeItem(key)
        return Promise.resolve()
      },
    }
  : createNoopStorage()

// Redux Persist Config
const persistConfig = {
  key: 'arthaus-root',
  version: 1,
  storage,
  whitelist: ['auth', 'cart'], // Only persist auth and cart
  blacklist: ['ui'], // Don't persist UI state
}

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  menu: menuReducer,
  order: orderReducer,
  ui: uiReducer,
  restaurant: restaurantReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.DEV,
})

export const persistor = persistStore(store)
