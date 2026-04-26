import axios from 'axios'
import { store } from '../store'
import { logout, setToken } from '../store/slices/authSlice'
import { addToast } from '../store/slices/uiSlice'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor - Add auth token and session ID
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token
    const sessionId = state.cart.sessionId

    // 🔍 Debug logging
    console.log('🔐 API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'none'
    })

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const state = store.getState()
        const refreshToken = state.auth.refreshToken

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          })

          const { token } = response.data.data
          store.dispatch(setToken(token))

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logout())
        store.dispatch(addToast({
          type: 'error',
          message: 'Session expired. Please login again.',
        }))
      }
    }

    // Handle network errors
    if (!error.response) {
      store.dispatch(addToast({
        type: 'error',
        message: 'Network error. Please check your connection.',
      }))
    }

    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: (token) => apiClient.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  }),
  updateProfile: (token, data) => apiClient.patch('/auth/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  }),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', { refreshToken }),
  
  // Social Auth
  googleLogin: (idToken) => apiClient.post('/auth/google', { idToken }),
  facebookLogin: (accessToken) => apiClient.post('/auth/facebook', { accessToken }),
}

// Menu API
export const menuAPI = {
  getMenu: () => apiClient.get('/menu'),
  getCategories: () => apiClient.get('/menu/categories'),
  getSubcategories: (categoryId) => apiClient.get(`/menu/categories/${categoryId}/subcategories`),
  getProducts: (subcategoryId, { page = 1, limit = 20 } = {}) =>
    apiClient.get(`/menu/products/${subcategoryId}`, { params: { page, limit } }),
  getProduct: (id) => apiClient.get(`/menu/product/${id}`),
  search: (query, limit = 20) => apiClient.get('/menu/search', {
    params: { q: query, limit }
  }),
}

// Cart API
export const cartAPI = {
  getCart: (token, sessionId) => apiClient.get('/orders/cart', {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'X-Session-ID': sessionId,
    }
  }),
  addItem: (token, item, sessionId) => apiClient.post('/orders/cart', item, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'X-Session-ID': sessionId,
    }
  }),
  updateItem: (token, itemId, quantity, sessionId) =>
    apiClient.patch(`/orders/cart/${itemId}`, { quantity }, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'X-Session-ID': sessionId,
      }
    }),
  removeItem: (token, itemId, sessionId) =>
    apiClient.delete(`/orders/cart/${itemId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'X-Session-ID': sessionId,
      }
    }),
  clearCart: (token, sessionId) => apiClient.delete('/orders/cart', {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'X-Session-ID': sessionId,
    }
  }),
}

// Order API
export const orderAPI = {
  create: (token, orderData) => apiClient.post('/orders', orderData, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  getMyOrders: (token, { page = 1, limit = 20 } = {}) =>
    apiClient.get('/orders/my-orders', {
      params: { page, limit },
      headers: { Authorization: `Bearer ${token}` }
    }),
  getOrder: (token, uuid) => apiClient.get(`/orders/${uuid}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  cancel: (token, orderId) => apiClient.delete(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
}

// Health Check
export const healthCheck = () => apiClient.get('/health')

export default apiClient
