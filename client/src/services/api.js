import axios from 'axios'
import { store } from '../store'
import { logout, setToken } from '../store/slices/authSlice'
import { addToast } from '../store/slices/uiSlice'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

const inFlightGetRequests = new Map()
const getResponseCache = new Map()
const GET_CACHE_TTL_MS = 5000
let globalRateLimitUntil = 0

// Clear cache function
export const clearCache = () => {
  getResponseCache.clear()
  inFlightGetRequests.clear()
}

// Request Interceptor - Add auth token and session ID
apiClient.interceptors.request.use(
  (config) => {
    if (Date.now() < globalRateLimitUntil) {
      return Promise.reject({
        response: { status: 429 },
        message: 'Rate limited',
        config,
      })
    }

    const state = store.getState()
    const token = state.auth.token
    const sessionId = state.cart.sessionId

    // 🔍 Debug logging
    if (import.meta.env.DEV) {
      console.log('🔐 API Request:', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        token: token ? `${token.substring(0, 20)}...` : 'none'
      })
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId
    }

    // Send current restaurant subdomain as header for tenant identification
    // Uses Redux store's current restaurant instead of window.location.hostname
    // This ensures correct restaurant context even when on base domain or IP
    const restaurantSubdomain = state.restaurant?.subdomain
    if (restaurantSubdomain) {
      config.headers['X-Restaurant-Subdomain'] = restaurantSubdomain
    }

    // Also add restaurant query param for non-GET requests (POST/PUT/DELETE)
    // Backend uses this as fallback for tenant identification
    if (restaurantSubdomain && config.method !== 'get') {
      config.params = { ...config.params, restaurant: restaurantSubdomain }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const originalGet = apiClient.get.bind(apiClient)

apiClient.get = (url, config = {}) => {
  if (Date.now() < globalRateLimitUntil) {
    return Promise.reject({
      response: { status: 429 },
      message: 'Rate limited',
      config: { url, method: 'get', ...config },
    })
  }

  const cacheKey = `${API_BASE_URL}|${url}|${JSON.stringify(config?.params || {})}`

  const cached = getResponseCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url, method: 'get', ...config },
      request: null,
    })
  }

  const inFlight = inFlightGetRequests.get(cacheKey)
  if (inFlight) {
    return inFlight
  }

  const reqPromise = originalGet(url, config)
    .then((res) => {
      getResponseCache.set(cacheKey, { timestamp: Date.now(), data: res.data })
      inFlightGetRequests.delete(cacheKey)
      return res
    })
    .catch((err) => {
      inFlightGetRequests.delete(cacheKey)
      throw err
    })

  inFlightGetRequests.set(cacheKey, reqPromise)
  return reqPromise
}

// Response Interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 429) {
      globalRateLimitUntil = Date.now() + 15000
    }

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

    // Handle 403 - Subscription expired or required
    if (error.response?.status === 403) {
      const errorData = error.response?.data?.errors || error.response?.data?.data || error.response?.data
      const errorCode = errorData?.code

      if (errorCode === 'SUBSCRIPTION_EXPIRED' || errorCode === 'SUBSCRIPTION_REQUIRED') {
        store.dispatch(logout())
        store.dispatch(addToast({
          type: 'error',
          message: errorCode === 'SUBSCRIPTION_EXPIRED'
            ? 'Your subscription has expired. Please renew to continue.'
            : 'Subscription required. Please purchase a plan.',
        }))

        // Redirect to subscription catalog page
        window.location.href = errorCode === 'SUBSCRIPTION_EXPIRED'
          ? '/subscription-catalog?expired=true'
          : '/subscription-catalog'
        return Promise.reject(error)
      }

      if (errorCode === 'SUBSCRIPTION_BLOCKED') {
        store.dispatch(logout())
        store.dispatch(addToast({
          type: 'error',
          message: errorData?.message || 'Your subscription has been suspended. Please contact support.',
        }))
        return Promise.reject(error)
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
  getPlans: () => apiClient.get('/subscription/plans'),
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
  googleLogin: (data) => apiClient.post('/auth/google', data),
  facebookLogin: (accessToken) => apiClient.post('/auth/facebook', { accessToken }),
}

// Helper to get restaurant subdomain from URL for multi-tenant menu calls
const getRestaurantParam = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('restaurant') || undefined
}

// Menu API
export const menuAPI = {
  getMenu: (extraParams = {}) => apiClient.get('/menu', { params: { restaurant: getRestaurantParam(), ...extraParams } }),
  getCategories: () => apiClient.get('/menu/categories', { params: { restaurant: getRestaurantParam() } }),
  getSubcategories: (categoryId) => apiClient.get(`/menu/categories/${categoryId}/subcategories`, {
    params: { restaurant: getRestaurantParam() }
  }),
  getProducts: (subcategoryId, { page = 1, limit = 20 } = {}) =>
    apiClient.get(`/menu/products/${subcategoryId}`, {
      params: { page, limit, restaurant: getRestaurantParam() }
    }),
  getProduct: (id) => apiClient.get(`/menu/product/${id}`, {
    params: { restaurant: getRestaurantParam() }
  }),
  search: (query, limit = 20) => apiClient.get('/menu/search', {
    params: { q: query, limit, restaurant: getRestaurantParam() }
  }),

  // Admin methods
  createProduct: (data) => apiClient.post('/menu', data),
  updateProduct: (id, data) => apiClient.patch(`/menu/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/menu/${id}`),
  toggleAvailability: (id, isAvailable) =>
    apiClient.patch(`/menu/${id}/availability`, { isAvailable }),

  // Category management
  createCategory: (data) => apiClient.post('/menu/categories', data),
  updateCategory: (id, data) => apiClient.patch(`/menu/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/menu/categories/${id}`),

  // Subcategory management
  createSubcategory: (data) => apiClient.post('/menu/subcategories', data),
  updateSubcategory: (id, data) => apiClient.patch(`/menu/subcategories/${id}`, data),
  deleteSubcategory: (id) => apiClient.delete(`/menu/subcategories/${id}`),
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
