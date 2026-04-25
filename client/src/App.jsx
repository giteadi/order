import { useState, useEffect, useLayoutEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
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
import { logout, selectIsAuthenticated, selectUser, setUser } from './store/slices/authSlice'

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
import { RestaurantSettings } from './components/RestaurantSettings'
import { useTableNumber } from './hooks/useTableNumber'
import { useCursor } from './hooks/useCursor'

const menuData = {
  categories: [
    { id: 2, name: 'Coffee/Beverage Menu', icon: '☕' },
    { id: 3, name: 'Food Menu', icon: '🍽️' }
  ],
  subcategories: {
    2: [
      { id: 'espresso', name: 'Espresso Classics', count: 11 },
      { id: 'artisan', name: 'Artisan Espresso', count: 8 },
      { id: 'iced', name: 'Iced Classics', count: 10 },
      { id: 'iced-tea', name: 'Iced Tea', count: 6 },
      { id: 'signature', name: 'ArtHaus Signature', count: 7 },
      { id: 'matcha', name: 'Matcha Collection', count: 5 },
      { id: 'iced-brew', name: 'Signature Iced Brews', count: 9 },
      { id: 'frappe', name: 'Frappes & Cold', count: 12 },
      { id: 'dessert', name: 'Coffee Desserts', count: 8 },
      { id: 'special', name: 'Special Frappes', count: 6 },
      { id: 'milkshake', name: 'Milkshakes', count: 7 },
      { id: 'coolers', name: 'Coolers & Refreshers', count: 5 },
      { id: 'extras', name: 'Extras & Add-Ons', count: 15 }
    ],
    3: [
      { id: 'breakfast', name: 'Breakfast', count: 8 },
      { id: 'sandwiches', name: 'Sandwiches', count: 12 },
      { id: 'pasta', name: 'Pasta', count: 10 },
      { id: 'pizza', name: 'Pizza', count: 8 },
      { id: 'burgers', name: 'Burgers', count: 6 },
      { id: 'salads', name: 'Salads', count: 7 },
      { id: 'desserts', name: 'Desserts', count: 10 }
    ]
  },
  products: {
    espresso: [
      { id: 1, name: 'Espresso', price: 120, image: '☕', description: 'Pure, bold, intense' },
      { id: 2, name: 'Americano', price: 140, image: '🫖', description: 'Smooth, diluted perfection' },
      { id: 3, name: 'Macchiato', price: 150, image: '🥛', description: 'Espresso marked with foam' },
      { id: 4, name: 'Cortado', price: 160, image: '🍶', description: 'Balanced espresso with milk' },
      { id: 5, name: 'Doppio', price: 180, image: '☕', description: 'Double espresso shot' },
      { id: 6, name: 'Lungo', price: 150, image: '🫖', description: 'Long-pulled espresso' },
      { id: 7, name: 'Ristretto', price: 170, image: '☕', description: 'Short, concentrated shot' },
      { id: 8, name: 'Flat White', price: 190, image: '🥛', description: 'Velvety microfoam' },
      { id: 9, name: 'Piccolo', price: 160, image: '🥛', description: 'Small latte' },
      { id: 10, name: 'Affogato', price: 220, image: '🍨', description: 'Espresso over ice cream' },
      { id: 11, name: 'Red Eye', price: 200, image: '☕', description: 'Espresso with drip coffee' }
    ],
    breakfast: [
      { id: 101, name: 'Pancakes', price: 180, image: '🥞', description: 'Fluffy with maple syrup' },
      { id: 102, name: 'French Toast', price: 200, image: '🍞', description: 'Classic breakfast favorite' },
      { id: 103, name: 'Omelette', price: 150, image: '🍳', description: 'Three eggs, your choice' },
      { id: 104, name: 'Avocado Toast', price: 220, image: '🥑', description: 'Fresh avocado on sourdough' },
      { id: 105, name: 'Waffles', price: 190, image: '🧇', description: 'Crispy golden waffles' },
      { id: 106, name: 'Breakfast Burrito', price: 210, image: '🌯', description: 'Eggs, cheese, beans' },
      { id: 107, name: 'Bagel & Cream Cheese', price: 140, image: '🥯', description: 'Toasted bagel' },
      { id: 108, name: 'Eggs Benedict', price: 250, image: '🍳', description: 'Poached eggs, hollandaise' }
    ],
    sandwiches: [
      { id: 201, name: 'Club Sandwich', price: 250, image: '🥪', description: 'Triple decker classic' },
      { id: 202, name: 'Grilled Cheese', price: 180, image: '🧀', description: 'Melted cheese perfection' },
      { id: 203, name: 'BLT', price: 220, image: '🥓', description: 'Bacon, lettuce, tomato' },
      { id: 204, name: 'Veggie Delight', price: 200, image: '🥗', description: 'Fresh vegetables & hummus' },
      { id: 205, name: 'Turkey Club', price: 260, image: '🥪', description: 'Turkey, bacon, cheese' },
      { id: 206, name: 'Reuben', price: 240, image: '🥪', description: 'Corned beef, sauerkraut' },
      { id: 207, name: 'Caprese', price: 210, image: '🥪', description: 'Mozzarella, tomato, basil' },
      { id: 208, name: 'Tuna Melt', price: 195, image: '🥪', description: 'Tuna salad, melted cheese' }
    ],
    pasta: [
      { id: 301, name: 'Spaghetti Carbonara', price: 320, image: '🍝', description: 'Creamy Italian classic' },
      { id: 302, name: 'Penne Arrabbiata', price: 280, image: '🍝', description: 'Spicy tomato sauce' },
      { id: 303, name: 'Fettuccine Alfredo', price: 340, image: '🍝', description: 'Rich cream sauce' },
      { id: 304, name: 'Pesto Pasta', price: 300, image: '🍝', description: 'Fresh basil pesto' },
      { id: 305, name: 'Lasagna', price: 350, image: '🍝', description: 'Layered meat & cheese' },
      { id: 306, name: 'Ravioli', price: 330, image: '🍝', description: 'Stuffed pasta pillows' },
      { id: 307, name: 'Mac & Cheese', price: 260, image: '🍝', description: 'Creamy comfort food' },
      { id: 308, name: 'Bolognese', price: 310, image: '🍝', description: 'Meat tomato sauce' }
    ],
    pizza: [
      { id: 401, name: 'Margherita', price: 350, image: '🍕', description: 'Classic tomato & mozzarella' },
      { id: 402, name: 'Pepperoni', price: 400, image: '🍕', description: 'Loaded with pepperoni' },
      { id: 403, name: 'Veggie Supreme', price: 380, image: '🍕', description: 'Garden fresh vegetables' },
      { id: 404, name: 'BBQ Chicken', price: 420, image: '🍕', description: 'Smoky BBQ sauce & chicken' },
      { id: 405, name: 'Hawaiian', price: 390, image: '🍕', description: 'Ham & pineapple' },
      { id: 406, name: 'Meat Lovers', price: 450, image: '🍕', description: 'All the meats' },
      { id: 407, name: 'Four Cheese', price: 410, image: '🍕', description: 'Cheese blend delight' },
      { id: 408, name: 'Mushroom', price: 370, image: '🍕', description: 'Fresh mushroom topping' }
    ],
    burgers: [
      { id: 501, name: 'Classic Burger', price: 280, image: '🍔', description: 'Beef patty with all fixings' },
      { id: 502, name: 'Cheese Burger', price: 320, image: '🍔', description: 'Double cheese delight' },
      { id: 503, name: 'Veggie Burger', price: 260, image: '🍔', description: 'Plant-based patty' },
      { id: 504, name: 'Chicken Burger', price: 300, image: '🍔', description: 'Grilled chicken breast' }
    ],
    salads: [
      { id: 601, name: 'Caesar Salad', price: 220, image: '🥗', description: 'Romaine, parmesan, croutons' },
      { id: 602, name: 'Greek Salad', price: 240, image: '🥗', description: 'Feta, olives, cucumber' },
      { id: 603, name: 'Garden Salad', price: 200, image: '🥗', description: 'Fresh mixed greens' },
      { id: 604, name: 'Quinoa Bowl', price: 280, image: '🥗', description: 'Protein-packed quinoa' }
    ],
    desserts: [
      { id: 701, name: 'Chocolate Cake', price: 180, image: '🍰', description: 'Rich chocolate layers' },
      { id: 702, name: 'Cheesecake', price: 200, image: '🍰', description: 'Creamy New York style' },
      { id: 703, name: 'Brownie', price: 150, image: '🍫', description: 'Fudgy chocolate brownie' },
      { id: 704, name: 'Ice Cream', price: 120, image: '🍨', description: 'Three scoops, your choice' }
    ]
  }
}

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
  
  const [selectedCategory, setSelectedCategory] = useState(2)
  const [selectedSubcategory, setSelectedSubcategory] = useState('espresso')
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

  const activeTab = location.pathname.replace('/', '') || 'home'
  
  // Redux action wrappers
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

  const filteredProducts = menuData.products[selectedSubcategory]?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handlePlaceOrder = () => {
    alert(`Order placed for Table ${tableNumber}! Total: ₹${cartTotal}`)
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
    navigate('/menu')
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

  const startOrdering = () => {
    navigate('/menu')
  }

  return (
    <div className="min-h-screen transition-colors duration-500 pb-24 md:pb-20 bg-gray-50">
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
            <FeatureSection 
              title="Premium Quality"
              description="Every cup is crafted with precision and passion"
              images={[
                'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
                'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
                'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80'
              ]}
              direction="left"
            />
            <ImageCarousel />
            <FeatureSection 
              title="Artisan Craft"
              description="Traditional methods meet modern innovation"
              images={[
                'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
                'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80',
                'https://images.unsplash.com/photo-1493857671505-72967e2cf276?w=800&q=80'
              ]}
              direction="right"
            />
            <MultiLayerParallax />
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
              categories={menuData.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr] gap-4 lg:gap-6">
                <SubcategorySidebar 
                  subcategories={menuData.subcategories[selectedCategory]}
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
                      {menuData.subcategories[selectedCategory]?.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.count} items)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Desktop: Show heading */}
                  <h2 className="hidden lg:block text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
                    {menuData.subcategories[selectedCategory]?.find(s => s.id === selectedSubcategory)?.name}
                  </h2>
                  <ProductGrid 
                    products={filteredProducts}
                    onAddToCart={handleAddToCart}
                    onProductClick={handleProductClick}
                    onCursorHover={setHovering}
                  />
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
            onLogin={(data) => {
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
                
                // Auto-redirect for admin/super admin
                const userRole = data.user.role
                console.log('Checking role:', userRole)
                if (userRole === 'admin' || userRole === 'super_admin') {
                  console.log('Redirecting to admin')
                  navigate('/admin')
                } else {
                  console.log('Redirecting to menu, role is:', userRole)
                  navigate('/menu')
                }
              } else {
                navigate('/menu')
              }
            }}
            onNavigateToRegister={() => navigate('/register')}
            onNavigateToForgot={() => navigate('/forgot-password')}
          />
        } />
        <Route path="/register" element={
          <RegisterScreen 
            onRegister={(data) => {
              console.log('Register:', data)
              navigate('/menu')
            }}
            onNavigateToLogin={() => navigate('/login')}
          />
        } />
        <Route path="/forgot-password" element={
          <ForgotPasswordScreen 
            onSendReset={(email) => console.log('Reset password for:', email)}
            onNavigateToLogin={() => navigate('/login')}
          />
        } />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/admin/menu" element={<MenuManagement />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/orders" element={<OrderManagement />} />
        <Route path="/admin/settings" element={<RestaurantSettings />} />
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
      />

      <ProductModal 
        isOpen={!!selectedProduct}
        onClose={() => dispatch(closeProductModal())}
        product={selectedProduct}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />

      <FloatingCartButton 
        cartCount={cartCount}
        onClick={handleOpenCart}
      />

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
    </div>
  )
}

export default App
