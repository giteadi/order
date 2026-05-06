import { useState, useEffect, useLayoutEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Header } from './components/Header'

// Redux actions and selectors
import { 
  addItem, 
  removeItem, 
  updateQuantity, 
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectSessionId,
} from './store/slices/cartSlice'
import { 
  openCart, 
  closeCart, 
  selectIsCartOpen,
  openProductModal,
  closeProductModal,
  selectSelectedProduct,
  selectIsProductModalOpen,
} from './store/slices/uiSlice'
import { logout, selectIsAuthenticated, selectUser, selectToken, setUser } from './store/slices/authSlice'
import { fetchRestaurantBySubdomain, selectCurrentRestaurant } from './store/slices/restaurantSlice'
import { 
  fetchCategories, fetchProducts, fetchMenu,
  selectCategories, selectFullMenu, selectMenuLoading,
  setSelectedCategory as setReduxCategory,
  setSelectedSubcategory as setReduxSubcategory,
} from './store/slices/menuSlice'

gsap.registerPlugin(ScrollTrigger)

import { CategoryTabs } from './components/CategoryTabs'
import { SubcategorySidebar } from './components/SubcategorySidebar'
import { ProductGrid } from './components/ProductGrid'
import { CartSidebar } from './components/CartSidebar'
import { ProductModal } from './components/ProductModal'
import { CustomCursor } from './components/CustomCursor'
import { FloatingCartButton } from './components/FloatingCartButton'
import { HeroSection } from './components/HeroSection'
import { FeatureSection } from './components/FeatureSection'
import { FeaturedItemsSection } from './components/FeaturedItemsSection'
import { ImageCarousel } from './components/ImageCarousel'
import { HighlightsStrip } from './components/HighlightsStrip'
import { MultiLayerParallax } from './components/ParallaxSection'
import { BottomNav } from './components/BottomNav'
import { EmptyStateScreen } from './components/EmptyStateScreen'
import { GroupOrderSheet } from './components/GroupOrderSheet'
import { GroupOrderScreen } from './components/GroupOrderScreen'
import { LoginScreen } from './components/LoginScreen'
import { RegisterScreen } from './components/RegisterScreen'
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { AdminDashboard } from './components/AdminDashboard'
import { SuperAdminDashboard } from './components/SuperAdminDashboard'
import { MenuManagement } from './components/MenuManagement'
import { UserManagement } from './components/UserManagement'
import { OrderManagement } from './components/OrderManagement'
import { OrderHistoryScreen } from './components/OrderHistoryScreen'
import { RestaurantSettings } from './components/RestaurantSettings'
import { CarouselManagement } from './components/CarouselManagement'
import { TablesManagement } from './components/TablesManagement'
import { PricingPage } from './components/PricingPage'
import { PaymentPage } from './components/PaymentPage'
import { SubscriptionHistory } from './components/SubscriptionHistory'
import { PaymentVerification } from './components/PaymentVerification'
import { SuperAdminSubscriptions } from './components/SuperAdminSubscriptions'
import { SubscriptionCatalog } from './components/SubscriptionCatalog'
import { PrivacyPolicy } from './components/PrivacyPolicy'
import { TermsAndConditions } from './components/TermsAndConditions'
import { RefundPolicy } from './components/RefundPolicy'
import { useTableNumber } from './hooks/useTableNumber'
import { useCursor } from './hooks/useCursor'


function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  
  // Redux selectors
  const cart = useSelector(selectCartItems)
  const cartTotal = useSelector(selectCartTotal)
  const cartCount = useSelector(selectCartItemCount)
  const isCartOpen = useSelector(selectIsCartOpen)
  const selectedProduct = useSelector(selectSelectedProduct)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)
  const token = useSelector(selectToken)
  
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [dynamicSubcategories, setDynamicSubcategories] = useState([])
  const [dynamicProducts, setDynamicProducts] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)

  // Dynamic menu from Redux
  const apiCategories = useSelector(selectCategories)
  const fullMenu = useSelector(selectFullMenu)
  const [isGroupOrderOpen, setIsGroupOrderOpen] = useState(false)
  const [isGroupOrderScreenOpen, setIsGroupOrderScreenOpen] = useState(false)
  const [groupOrderData, setGroupOrderData] = useState({
    code: '',
    members: [],
    orders: {}
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [quantity, setQuantity] = useState(1)

  const tableNumber = useTableNumber()
  const { cursorPosition, isCursorHovering, setHovering } = useCursor()
  const restaurant = useSelector(selectCurrentRestaurant)

  const activeTab = location.pathname.replace('/', '') || 'home'

  // Global effect: Read restaurant from URL or use persisted Redux state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const restaurantFromUrl = urlParams.get('restaurant')
    const restaurantFromRedux = restaurant?.subdomain

    if (restaurantFromUrl) {
      // URL has restaurant - update Redux
      console.log('🌐 App: Restaurant from URL:', restaurantFromUrl)
      dispatch(fetchRestaurantBySubdomain(restaurantFromUrl))
    } else if (restaurantFromRedux) {
      // No URL param but Redux has restaurant - redirect to add restaurant parameter
      console.log('💾 App: Redirecting to add persisted restaurant:', restaurantFromRedux)
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('restaurant', restaurantFromRedux)
      window.location.href = currentUrl.toString()
    } else {
      console.log('⚠️ App: No restaurant specified')
    }
  }, [dispatch, restaurant?.subdomain])
  
  // Fetch menu from API — pass restaurant subdomain for isolation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const restaurantSubdomain = urlParams.get('restaurant') || restaurant?.subdomain || null
    dispatch(fetchMenu(restaurantSubdomain))
  }, [dispatch, restaurant?.subdomain])

  // When categories load, select first one
  useEffect(() => {
    if (apiCategories?.length > 0 && !selectedCategory) {
      const firstCat = apiCategories[0]
      setSelectedCategory(firstCat.id)
    }
  }, [apiCategories])

  // When category changes, load subcategories
  useEffect(() => {
    if (!selectedCategory) return
    const loadSubcategories = async () => {
      try {
        const { menuAPI } = await import('./services/api')
        const restaurantSubdomain = new URLSearchParams(window.location.search).get('restaurant') || restaurant?.subdomain
        const res = await menuAPI.getSubcategories(selectedCategory, restaurantSubdomain)
        if (res.data.success) {
          const subs = res.data.data || []
          setDynamicSubcategories(subs)
          if (subs.length > 0) {
            setSelectedSubcategory(subs[0].id)
          }
        }
      } catch (e) {
        console.error('Failed to load subcategories', e)
      }
    }
    loadSubcategories()
  }, [selectedCategory, restaurant?.subdomain])

  // When subcategory changes, load products
  useEffect(() => {
    if (!selectedSubcategory) return
    const loadProducts = async () => {
      setMenuLoading(true)
      try {
        const { menuAPI } = await import('./services/api')
        const restaurantSubdomain = new URLSearchParams(window.location.search).get('restaurant') || restaurant?.subdomain
        const res = await menuAPI.getProducts(selectedSubcategory, { restaurant: restaurantSubdomain })
        if (res.data.success) {
          setDynamicProducts(res.data.data || [])
        }
      } catch (e) {
        console.error('Failed to load products', e)
      } finally {
        setMenuLoading(false)
      }
    }
    loadProducts()
  }, [selectedSubcategory, restaurant?.subdomain])
  const handleAddToCart = (product, qty = 1) => {
    dispatch(addItem({ product, quantity: qty }))
    dispatch(closeProductModal())
    dispatch(openCart())
  }
  
  const handleRemoveFromCart = (itemId) => {
    dispatch(removeItem(itemId))
  }
  
  const handleUpdateQuantity = (itemId, qty) => {
    dispatch(updateQuantity({ itemId, quantity: qty }))
  }
  
  const handleProductClick = (product) => {
    dispatch(openProductModal(product))
    setQuantity(1)
  }
  
  const handleCloseCart = () => dispatch(closeCart())
  const handleOpenCart = () => dispatch(openCart())

  // Initialize Lenis once on mount
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    })

    let rafId
    function raf(time) {
      // Stop Lenis when overlay is open
      if (document.body.getAttribute('data-lenis-stop') === 'true') {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(raf)
        return
      }
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  // Handle route changes separately
  useEffect(() => {
    console.log('🔄 Route changing to:', location.pathname)
    
    // Kill all ScrollTriggers before route change to prevent DOM manipulation issues
    const triggers = ScrollTrigger.getAll()
    console.log('🎯 Killing ScrollTriggers:', triggers.length)
    triggers.forEach((trigger, index) => {
      console.log(`  Trigger ${index}:`, trigger.vars?.trigger?.className || 'unknown')
      trigger.kill(true) // true = immediately kill without animation
    })
    
    // Scroll to top on route change
    window.scrollTo(0, 0)
    
    // Refresh ScrollTrigger after route change
    const timer = setTimeout(() => {
      console.log('✅ ScrollTrigger refresh complete')
      ScrollTrigger.refresh()
    }, 100)

    return () => {
      console.log('🧹 Cleanup route effect for:', location.pathname)
      clearTimeout(timer)
    }
  }, [location.pathname])


  const handleGroupOrderAdd = (product, qty = 1) => {
    if (groupOrderData.code && groupOrderData.members.length > 0) {
      setGroupOrderData(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          user1: [...(prev.orders.user1 || []), { ...product, quantity: qty }]
        }
      }))
      setIsGroupOrderScreenOpen(true)
    }
  }

  const filteredProducts = dynamicProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handlePlaceOrder = async () => {
    try {
      console.log('📤 Placing order...', { 
        cart, 
        tableNumber, 
        user,
        total: cartTotal 
      })

      // Get restaurant from URL
      const params = new URLSearchParams(window.location.search)
      const restaurant = params.get('restaurant')

      // Import orderAPI and toast
      const { orderAPI } = await import('./services/api')
      const toast = (await import('react-hot-toast')).default

      // Prepare order data
      const orderData = {
        tableNumber: parseInt(tableNumber),
        items: cart.map(item => ({
          productId: item.productId, // Use productId, not id
          quantity: item.quantity,
          customizations: item.customizations || []
        })),
        specialInstructions: '',
        restaurant
      }

      console.log('📤 Order data:', orderData)

      // Create order
      const response = await orderAPI.create(token, orderData)
      console.log('✅ Order created:', response.data)

      // Clear cart
      dispatch(clearCart())

      // Close cart
      dispatch(closeCart())

      // Show success toast
      toast.success('Order Successful!', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
        },
        icon: '✅',
      })

    } catch (error) {
      console.error('❌ Order placement failed:', error)
      console.error('Error response:', error.response?.data)
      
      // Show error toast
      const toast = (await import('react-hot-toast')).default
      toast.error(error.response?.data?.message || 'Failed to place order', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
        },
        icon: '❌',
      })
    }
  }

  const handleCreateGroupOrder = () => {
    // Generate random group code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Initialize group with current user and demo data
    setGroupOrderData({
      code: code,
      members: [
        { id: 'user1', name: 'You' },
        { id: 'user2', name: 'Rahul' },
        { id: 'user3', name: 'Priya' }
      ],
      orders: {
        user1: [
          { id: 1, name: 'Espresso', price: 120, image: '☕', quantity: 2 }
        ],
        user2: [
          { id: 2, name: 'Americano', price: 140, image: '🫖', quantity: 1 }
        ],
        user3: []
      }
    })
    
    setIsGroupOrderOpen(false)
    setIsGroupOrderScreenOpen(true)
  }

  const handleAddItemToGroupOrder = (memberId) => {
    // Close group order screen and open menu
    setIsGroupOrderScreenOpen(false)
    navigateWithParams('/menu')
  }

  const handleRemoveItemFromGroupOrder = (memberId, itemIndex) => {
    setGroupOrderData(prev => ({
      ...prev,
      orders: {
        ...prev.orders,
        [memberId]: prev.orders[memberId].filter((_, idx) => idx !== itemIndex)
      }
    }))
  }

  const handleGroupOrderCheckout = () => {
    const totalAmount = Object.values(groupOrderData.orders).reduce((sum, userOrders) => {
      return sum + userOrders.reduce((userSum, item) => userSum + (item.price * item.quantity), 0)
    }, 0)
    
    alert(`Group order placed for Table ${tableNumber}! Total: ₹${totalAmount}`)
    setIsGroupOrderScreenOpen(false)
    setGroupOrderData({ code: '', members: [], orders: {} })
  }

  // Navigate with query params preserved
  const navigateWithParams = (path) => {
    const currentParams = new URLSearchParams(window.location.search)
    const queryString = currentParams.toString()
    const fullPath = queryString ? `${path}?${queryString}` : path
    navigate(fullPath)
  }

  const startOrdering = () => {
    navigateWithParams('/menu')
  }

  return (
    <div className="min-h-screen transition-colors duration-500 pb-24 md:pb-20 bg-gray-50 overflow-x-hidden w-full">
      <CustomCursor 
        cursorPosition={cursorPosition} 
        isCursorHovering={isCursorHovering} 
      />

      <Routes>
        <Route path="/" element={
          <>
            <Header 
              tableNumber={tableNumber}
              showSearch={false}
              onCartClick={handleOpenCart}
              cartCount={cartCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
              variant="overlay"
              user={user}
            />
            <HeroSection />
            <FeaturedItemsSection 
              onProductClick={handleProductClick}
              onAddToCart={handleAddToCart}
              onCursorHover={setHovering}
            />
            <HighlightsStrip />
            <ImageCarousel carouselType="collection" />
          </>
        } />
        <Route path="/menu" element={
          <>
            <Header 
              tableNumber={tableNumber}
              showSearch={true}
              onCartClick={handleOpenCart}
              cartCount={cartCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
              user={user}
            />
            <CategoryTabs 
              categories={apiCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr] gap-4 lg:gap-6">
                <SubcategorySidebar 
                  subcategories={dynamicSubcategories}
                  selectedSubcategory={selectedSubcategory}
                  onSelectSubcategory={setSelectedSubcategory}
                />
                <div className="flex-1 min-w-0">
                  {/* Mobile: Compact Subcategory Dropdown */}
                  <div className="lg:hidden mb-4">
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      {dynamicSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Desktop: Show heading */}
                  <h2 className="hidden lg:block text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                    {dynamicSubcategories.find(s => s.id === selectedSubcategory)?.name}
                  </h2>
                  {menuLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <ProductGrid 
                      products={filteredProducts}
                      onAddToCart={handleAddToCart}
                      onProductClick={handleProductClick}
                      onCursorHover={setHovering}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        } />
        <Route path="/orders" element={
          <>
            <Header 
              tableNumber={tableNumber}
              showSearch={false}
              onCartClick={handleOpenCart}
              cartCount={cartCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
              user={user}
            />
            <EmptyStateScreen
              icon="🍽️"
              title="No Orders Yet"
              subtitle="You haven't ordered anything yet. Place your first order."
              ctaLabel="Start Ordering"
              onCta={startOrdering}
            />
          </>
        } />
        <Route path="/pay" element={
          <>
            <Header 
              tableNumber={tableNumber}
              showSearch={false}
              onCartClick={handleOpenCart}
              cartCount={cartCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
              user={user}
            />
            <EmptyStateScreen
              icon="🧾"
              title="No Bill Generated Yet"
              subtitle="Your bill will appear here once you place your order."
              ctaLabel="Start Ordering"
              onCta={startOrdering}
            />
          </>
        } />
        <Route path="/login" element={
          <LoginScreen 
            onLogin={async (data) => {
              console.log('Login data:', data)
              console.log('User:', data?.user)
              console.log('Role:', data?.user?.role)
              // Save user data to Redux
              if (data.user && data.token) {
                dispatch(setUser({
                  user: data.user,
                  token: data.token,
                  refreshToken: data.refreshToken,
                }))
                
                // Check subscription for restaurant owners (admin, manager, staff)
                const userRole = data.user.role
                const needsSubscription = ['admin', 'manager', 'staff'].includes(userRole)
                
                if (needsSubscription) {
                  try {
                    const { data: subData } = await apiClient.get('/subscription')
                    if (!subData.data) {
                      // Check if they had an expired subscription
                      try {
                        const histRes = await apiClient.get('/subscription/history')
                        const hasExpired = histRes.data?.data?.some(s => s.status === 'expired')
                        if (hasExpired) {
                          navigateWithParams('/subscription-catalog?expired=true')
                        } else {
                          navigateWithParams('/subscription-catalog')
                        }
                      } catch {
                        navigateWithParams('/subscription-catalog')
                      }
                      return
                    }
                  } catch (error) {
                    console.log('Subscription check failed, redirecting to catalog')
                    navigateWithParams('/subscription-catalog')
                    return
                  }
                }
                
                // Auto-redirect for admin/super admin
                console.log('Checking role:', userRole)
                if (userRole === 'admin' || userRole === 'super_admin') {
                  console.log('Redirecting to admin')
                  navigateWithParams('/admin')
                } else {
                  console.log('Redirecting to menu, role is:', userRole)
                  navigateWithParams('/menu')
                }
              } else {
                navigateWithParams('/menu')
              }
            }}
            onNavigateToRegister={() => navigateWithParams('/register')}
            onNavigateToForgot={() => navigateWithParams('/forgot-password')}
          />
        } />
        <Route path="/register" element={
          <RegisterScreen 
            onRegister={async (data) => {
              console.log('📤 App.jsx: Sending registration request', data)
              try {
                const { authAPI } = await import('./services/api')
                
                // Get restaurant from URL params
                const params = new URLSearchParams(window.location.search)
                const restaurant = params.get('restaurant')
                
                // Add restaurant to registration data
                const registrationData = {
                  ...data,
                  restaurant
                }
                
                console.log('📤 Registration data with restaurant:', registrationData)
                
                const response = await authAPI.register(registrationData)
                console.log('✅ Registration successful:', response.data)
                
                const { user, token, refreshToken } = response.data.data
                
                // Save user to Redux
                dispatch(setUser({
                  user,
                  token,
                  refreshToken,
                }))
                
                navigateWithParams('/menu')
              } catch (error) {
                console.error('❌ Registration error:', error)
                console.error('Error response:', error.response?.data)
                
                // Re-throw error so RegisterScreen can handle it
                throw error
              }
            }}
            onNavigateToLogin={() => navigateWithParams('/login')}
          />
        } />
        <Route path="/forgot-password" element={
          <ForgotPasswordScreen 
            onSendReset={async (email) => {
              try {
                const { authAPI } = await import('./services/api')
                const response = await authAPI.forgotPassword(email)
                // In dev mode, token is returned directly
                const { resetToken } = response.data.data
                return resetToken
              } catch (error) {
                console.error('Forgot password error:', error)
                alert('Failed to send reset instructions')
                return null
              }
            }}
            onResetPassword={async (token, newPassword) => {
              try {
                const { authAPI } = await import('./services/api')
                await authAPI.resetPassword(token, newPassword)
                alert('Password reset successful! Please login with your new password.')
                navigateWithParams('/login')
              } catch (error) {
                console.error('Reset password error:', error)
                alert('Failed to reset password')
              }
            }}
            onNavigateToLogin={() => navigateWithParams('/login')}
          />
        } />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/order-history" element={<OrderHistoryScreen />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/subscription-catalog" element={<SubscriptionCatalog />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/subscription/history" element={<SubscriptionHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptions />} />
        <Route path="/admin/menu" element={<MenuManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/carousel" element={<CarouselManagement />} />
        <Route path="/admin/settings" element={<RestaurantSettings />} />
        <Route path="/admin/tables" element={<TablesManagement />} />
        <Route path="/admin/payments" element={<PaymentVerification />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/table/:tableNumber" element={
          <>
            <Header 
              tableNumber={tableNumber}
              showSearch={true}
              onCartClick={handleOpenCart}
              cartCount={cartCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
              user={user}
            />
            <CategoryTabs 
              categories={apiCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr] gap-4 lg:gap-6">
                <SubcategorySidebar 
                  subcategories={dynamicSubcategories}
                  selectedSubcategory={selectedSubcategory}
                  onSelectSubcategory={setSelectedSubcategory}
                />
                <div className="flex-1 min-w-0">
                  <div className="lg:hidden mb-4">
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      {dynamicSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <h2 className="hidden lg:block text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                    {dynamicSubcategories.find(s => s.id === selectedSubcategory)?.name}
                  </h2>
                  {menuLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <ProductGrid 
                      products={filteredProducts}
                      onAddToCart={handleAddToCart}
                      onProductClick={handleProductClick}
                      onCursorHover={setHovering}
                    />
                  )}
                </div>
              </div>
            </div>
            <CartSidebar 
              isOpen={isCartOpen}
              onClose={handleCloseCart}
              cart={cart}
              tableNumber={tableNumber}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveFromCart}
              cartTotal={cartTotal}
              onPlaceOrder={handlePlaceOrder}
              isAuthenticated={isAuthenticated}
              onNavigateToLogin={() => {
                handleCloseCart()
                navigateWithParams('/login')
              }}
            />
          </>
        } />
      </Routes>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cart={cart}
        tableNumber={tableNumber}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        cartTotal={cartTotal}
        onPlaceOrder={handlePlaceOrder}
        isAuthenticated={isAuthenticated}
        onNavigateToLogin={() => {
          handleCloseCart()
          navigateWithParams('/login')
        }}
      />

      <ProductModal 
        isOpen={!!selectedProduct}
        onClose={() => dispatch(closeProductModal())}
        product={selectedProduct}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />

      {/* Show cart button only for customers, not admin/staff/manager */}
      {(!user?.role || ['customer', 'guest'].includes(user?.role)) && (
        <FloatingCartButton 
          cartCount={cartCount}
          onClick={handleOpenCart}
        />
      )}

      <GroupOrderSheet
        isOpen={isGroupOrderOpen}
        onClose={() => setIsGroupOrderOpen(false)}
        onCreate={handleCreateGroupOrder}
      />

      <GroupOrderScreen
        isOpen={isGroupOrderScreenOpen}
        onClose={() => setIsGroupOrderScreenOpen(false)}
        groupCode={groupOrderData.code}
        members={groupOrderData.members}
        orders={groupOrderData.orders}
        currentUser="user1"
        onAddItem={handleAddItemToGroupOrder}
        onRemoveItem={handleRemoveItemFromGroupOrder}
        onCheckout={handleGroupOrderCheckout}
      />

      <BottomNav />
      <Toaster position="top-center" />
    </div>
  )
}

export default App
