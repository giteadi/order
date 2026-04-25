import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { orderAPI } from '../../services/api'

// Async Thunks
export const createOrder = createAsyncThunk(
  'order/create',
  async (orderData, { rejectWithValue, getState }) => {
    try {
      const { auth, cart } = getState()
      const response = await orderAPI.create(auth.token, {
        ...orderData,
        sessionId: cart.sessionId,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place order')
    }
  }
)

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMyOrders',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const response = await orderAPI.getMyOrders(auth.token, { page, limit })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load orders')
    }
  }
)

export const fetchOrderDetails = createAsyncThunk(
  'order/fetchDetails',
  async (orderUuid, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const response = await orderAPI.getOrder(auth.token, orderUuid)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load order')
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'order/cancel',
  async (orderId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState()
      const response = await orderAPI.cancel(auth.token, orderId)
      return { orderId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order')
    }
  }
)

const initialState = {
  currentOrder: null,
  myOrders: [],
  orderHistory: [],
  pagination: null,
  isLoading: false,
  isCreating: false,
  error: null,
  createSuccess: false,
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
      state.createSuccess = false
    },
    clearError: (state) => {
      state.error = null
    },
    resetOrderState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true
        state.error = null
        state.createSuccess = false
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false
        state.currentOrder = action.payload
        state.createSuccess = true
        state.myOrders.unshift(action.payload)
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false
        state.error = action.payload
        state.createSuccess = false
      })

      // Fetch My Orders
      .addCase(fetchMyOrders.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.myOrders = action.payload.data || []
        state.pagination = action.payload.pagination
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Fetch Order Details
      .addCase(fetchOrderDetails.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const { orderId } = action.payload
        const order = state.myOrders.find(o => o.id === orderId)
        if (order) {
          order.status = 'cancelled'
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder.status = 'cancelled'
        }
      })
  },
})

export const { clearCurrentOrder, clearError, resetOrderState } = orderSlice.actions

// Selectors
export const selectCurrentOrder = (state) => state.order.currentOrder
export const selectMyOrders = (state) => state.order.myOrders
export const selectOrderLoading = (state) => state.order.isLoading
export const selectOrderCreating = (state) => state.order.isCreating
export const selectCreateSuccess = (state) => state.order.createSuccess
export const selectOrderError = (state) => state.order.error

export default orderSlice.reducer
