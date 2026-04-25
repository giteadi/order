import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cartAPI } from '../../services/api'
import { calculateCartTotal } from '../../utils/helpers'

// Async Thunks
export const syncCart = createAsyncThunk(
  'cart/sync',
  async (sessionId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const response = await cartAPI.getCart(auth.token, sessionId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

export const addToCartAPI = createAsyncThunk(
  'cart/addItem',
  async ({ product, quantity, customizations, sessionId }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const response = await cartAPI.addItem(auth.token, {
        productId: product.id,
        quantity,
        customizations,
      }, sessionId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message)
    }
  }
)

// Initial State
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  sessionId: null,
  isSyncing: false,
  lastSynced: null,
}

// Generate session ID if not exists
const getSessionId = () => {
  if (!initialState.sessionId) {
    initialState.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  return initialState.sessionId
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Local cart operations (immediate UI update)
    addItem: (state, action) => {
      const { product, quantity = 1, customizations = [] } = action.payload
      const existingIndex = state.items.findIndex(
        item => item.productId === product.id && 
        JSON.stringify(item.customizations) === JSON.stringify(customizations)
      )

      if (existingIndex > -1) {
        state.items[existingIndex].quantity += quantity
      } else {
        state.items.push({
          id: Date.now(), // Temporary ID
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          customizations,
          emojiIcon: product.emojiIcon || product.image,
          imageUrl: product.imageUrl,
        })
      }

      state.total = calculateCartTotal(state.items)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    removeItem: (state, action) => {
      const itemId = action.payload
      state.items = state.items.filter(item => item.id !== itemId)
      state.total = calculateCartTotal(state.items)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload
      const item = state.items.find(item => item.id === itemId)
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== itemId)
        } else {
          item.quantity = quantity
        }
      }

      state.total = calculateCartTotal(state.items)
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    },

    clearCart: (state) => {
      state.items = []
      state.total = 0
      state.itemCount = 0
    },

    setSessionId: (state, action) => {
      state.sessionId = action.payload
    },

    // Merge server cart with local
    mergeCart: (state, action) => {
      const serverCart = action.payload
      if (serverCart && serverCart.items) {
        // Merge logic: server cart takes precedence
        state.items = serverCart.items
        state.total = serverCart.total
        state.itemCount = serverCart.itemCount
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncCart.pending, (state) => {
        state.isSyncing = true
      })
      .addCase(syncCart.fulfilled, (state, action) => {
        state.isSyncing = false
        state.items = action.payload.items || []
        state.total = action.payload.total || 0
        state.itemCount = action.payload.itemCount || 0
        state.lastSynced = Date.now()
      })
      .addCase(syncCart.rejected, (state) => {
        state.isSyncing = false
      })
      .addCase(addToCartAPI.fulfilled, (state, action) => {
        // Update with server response
        state.items = action.payload.items || state.items
        state.total = action.payload.total || state.total
        state.itemCount = action.payload.itemCount || state.itemCount
      })
  },
})

export const { 
  addItem, 
  removeItem, 
  updateQuantity, 
  clearCart, 
  setSessionId,
  mergeCart 
} = cartSlice.actions

// Selectors
export const selectCartItems = (state) => state.cart.items
export const selectCartTotal = (state) => state.cart.total
export const selectCartItemCount = (state) => state.cart.itemCount
export const selectSessionId = (state) => state.cart.sessionId || getSessionId()

export default cartSlice.reducer
