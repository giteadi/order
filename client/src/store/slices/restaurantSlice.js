import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from '../../services/api'

// Async Thunk to fetch restaurant by subdomain
export const fetchRestaurantBySubdomain = createAsyncThunk(
  'restaurant/fetchBySubdomain',
  async (subdomain, { rejectWithValue }) => {
    console.log('🔍 Redux: Fetching restaurant for subdomain:', subdomain)
    try {
      const response = await apiClient.get('/admin/restaurants/public')
      console.log('📋 Redux: All restaurants:', response.data.data)
      if (response.data.success) {
        const restaurant = response.data.data.find(
          r => r.subdomain.toLowerCase() === subdomain.toLowerCase()
        )
        console.log('✅ Redux: Found restaurant:', restaurant)
        if (restaurant) {
          return restaurant
        }
        return rejectWithValue('Restaurant not found')
      }
      return rejectWithValue('Failed to fetch restaurants')
    } catch (error) {
      console.log('❌ Redux: Error fetching restaurant:', error.message)
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch restaurant')
    }
  }
)

// Initial State
const initialState = {
  currentRestaurant: null,
  subdomain: null,
  name: 'ArtHaus Café',
  logo: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&q=80',
  isLoading: false,
  error: null,
}

// Slice
const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState,
  reducers: {
    setRestaurant: (state, action) => {
      state.currentRestaurant = action.payload
      state.name = action.payload?.name || 'ArtHaus Café'
      state.subdomain = action.payload?.subdomain || null
      state.logo = action.payload?.logo_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&q=80'
    },
    setSubdomain: (state, action) => {
      state.subdomain = action.payload
    },
    clearRestaurant: (state) => {
      state.currentRestaurant = null
      state.subdomain = null
      state.name = 'ArtHaus Café'
      state.logo = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&q=80'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurantBySubdomain.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRestaurantBySubdomain.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentRestaurant = action.payload
        state.name = action.payload.name
        state.subdomain = action.payload.subdomain
        state.logo = action.payload.logo_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100&q=80'
      })
      .addCase(fetchRestaurantBySubdomain.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { setRestaurant, setSubdomain, clearRestaurant } = restaurantSlice.actions

// Selectors
export const selectCurrentRestaurant = (state) => state.restaurant.currentRestaurant
export const selectRestaurantName = (state) => state.restaurant.name
export const selectRestaurantSubdomain = (state) => state.restaurant.subdomain
export const selectRestaurantLogo = (state) => state.restaurant.logo
export const selectRestaurantLoading = (state) => state.restaurant.isLoading
export const selectRestaurantError = (state) => state.restaurant.error

export default restaurantSlice.reducer
