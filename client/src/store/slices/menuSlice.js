import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { menuAPI } from '../../services/api'

// Async Thunks
export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (_, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getMenu()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load menu')
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'menu/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getCategories()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load categories')
    }
  }
)

export const fetchProducts = createAsyncThunk(
  'menu/fetchProducts',
  async ({ subcategoryId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await menuAPI.getProducts(subcategoryId, { page, limit })
      return { subcategoryId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load products')
    }
  }
)

export const searchProducts = createAsyncThunk(
  'menu/searchProducts',
  async (query, { rejectWithValue }) => {
    try {
      const response = await menuAPI.search(query)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed')
    }
  }
)

const initialState = {
  categories: [],
  subcategories: {},
  products: {},
  fullMenu: null,
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
  selectedCategory: null,
  selectedSubcategory: null,
}

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload
    },
    setSelectedSubcategory: (state, action) => {
      state.selectedSubcategory = action.payload
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu
      .addCase(fetchMenu.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.isLoading = false
        state.fullMenu = action.payload
        // Extract categories
        state.categories = action.payload.map(cat => ({
          id: cat.id,
          name: cat.category_name,
          icon: cat.category_icon,
        }))
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })

      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        const { subcategoryId, data, pagination } = action.payload
        state.products[subcategoryId] = { data, pagination }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Search
      .addCase(searchProducts.pending, (state) => {
        state.isSearching = true
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isSearching = false
        state.searchResults = action.payload
      })
      .addCase(searchProducts.rejected, (state) => {
        state.isSearching = false
      })
  },
})

export const { 
  setSelectedCategory, 
  setSelectedSubcategory, 
  clearSearchResults,
  clearError 
} = menuSlice.actions

// Selectors
export const selectCategories = (state) => state.menu.categories
export const selectFullMenu = (state) => state.menu.fullMenu
export const selectProductsBySubcategory = (subcategoryId) => (state) => 
  state.menu.products[subcategoryId]?.data || []
export const selectSearchResults = (state) => state.menu.searchResults
export const selectMenuLoading = (state) => state.menu.isLoading
export const selectMenuError = (state) => state.menu.error

export default menuSlice.reducer
