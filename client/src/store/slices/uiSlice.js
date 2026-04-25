import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Sidebar/Cart states
  isCartOpen: false,
  isProductModalOpen: false,
  selectedProduct: null,
  
  // Toasts/Notifications
  toasts: [],
  
  // Loading states
  globalLoading: false,
  
  // Theme
  theme: 'light',
  
  // Navigation
  activeTab: 'home',
  
  // Modals
  activeModal: null,
  modalData: null,
}

let toastId = 0

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Cart
    openCart: (state) => {
      state.isCartOpen = true
    },
    closeCart: (state) => {
      state.isCartOpen = false
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen
    },
    
    // Product Modal
    openProductModal: (state, action) => {
      state.selectedProduct = action.payload
      state.isProductModalOpen = true
    },
    closeProductModal: (state) => {
      state.isProductModalOpen = false
      state.selectedProduct = null
    },
    
    // Toasts
    addToast: (state, action) => {
      const { type = 'info', message, duration = 3000 } = action.payload
      state.toasts.push({
        id: ++toastId,
        type,
        message,
        duration,
      })
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload)
    },
    
    // Loading
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload
    },
    
    // Theme
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    
    // Navigation
    setActiveTab: (state, action) => {
      state.activeTab = action.payload
    },
    
    // Generic Modal
    openModal: (state, action) => {
      const { modal, data = null } = action.payload
      state.activeModal = modal
      state.modalData = data
    },
    closeModal: (state) => {
      state.activeModal = null
      state.modalData = null
    },
    
    // Reset
    resetUI: (state) => {
      return { ...initialState, theme: state.theme }
    },
  },
})

export const {
  openCart,
  closeCart,
  toggleCart,
  openProductModal,
  closeProductModal,
  addToast,
  removeToast,
  setGlobalLoading,
  setTheme,
  toggleTheme,
  setActiveTab,
  openModal,
  closeModal,
  resetUI,
} = uiSlice.actions

// Selectors
export const selectIsCartOpen = (state) => state.ui.isCartOpen
export const selectSelectedProduct = (state) => state.ui.selectedProduct
export const selectIsProductModalOpen = (state) => state.ui.isProductModalOpen
export const selectToasts = (state) => state.ui.toasts
export const selectTheme = (state) => state.ui.theme
export const selectActiveTab = (state) => state.ui.activeTab

export default uiSlice.reducer
