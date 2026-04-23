import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom'
import Lenis from 'lenis'
import { Header } from './components/Header'
import { CategoryTabs } from './components/CategoryTabs'
import { SubcategorySidebar } from './components/SubcategorySidebar'
import { ProductGrid } from './components/ProductGrid'
import { CartSidebar } from './components/CartSidebar'
import { ProductModal } from './components/ProductModal'
import { CustomCursor } from './components/CustomCursor'
import { FloatingCartButton } from './components/FloatingCartButton'
import { HeroSection } from './components/HeroSection'
import { FeatureSection } from './components/FeatureSection'
import { ImageCarousel } from './components/ImageCarousel'
import { HighlightsStrip } from './components/HighlightsStrip'
import { MultiLayerParallax } from './components/ParallaxSection'
import { BottomNav } from './components/BottomNav'
import { EmptyStateScreen } from './components/EmptyStateScreen'
import { GroupOrderSheet } from './components/GroupOrderSheet'
import { useTableNumber } from './hooks/useTableNumber'
import { useCart } from './hooks/useCart'
import { useCursor } from './hooks/useCursor'

const menuData = {
  categories: [
    { id: 1, name: 'Art Supplies', icon: '🎨' },
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
    ]
  },
  products: {
    espresso: [
      { id: 1, name: 'Espresso', price: 120, image: '☕', description: 'Pure, bold, intense' },
      { id: 2, name: 'Americano', price: 140, image: '🫖', description: 'Smooth, diluted perfection' },
      { id: 3, name: 'Macchiato', price: 150, image: '🥛', description: 'Espresso marked with foam' },
      { id: 4, name: 'Cortado', price: 160, image: '🍶', description: 'Balanced espresso with milk' }
    ]
  }
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCategory, setSelectedCategory] = useState(2)
  const [selectedSubcategory, setSelectedSubcategory] = useState('espresso')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isGroupOrderOpen, setIsGroupOrderOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const tableNumber = useTableNumber()
  const { cursorPosition, isCursorHovering, setHovering } = useCursor()
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal } = useCart()

  const activeTab = location.pathname.replace('/', '') || 'home'

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

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])


  const handleAddToCart = (product, qty = 1) => {
    addToCart(product, qty)
    setSelectedProduct(null)
    setQuantity(1)
  }

  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
  }

  const filteredProducts = menuData.products[selectedSubcategory]?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handlePlaceOrder = () => {
    alert(`Order placed for Table ${tableNumber}! Total: ₹${cartTotal}`)
  }

  const startOrdering = () => {
    navigate('/menu')
  }

  return (
    <div className="min-h-screen transition-colors duration-500 pb-20 bg-gray-50">
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
              onCartClick={() => setIsCartOpen(true)}
              cartCount={cart.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
              variant="overlay"
            />
            <HeroSection />
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
              onCartClick={() => setIsCartOpen(true)}
              cartCount={cart.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
            />
            <CategoryTabs 
              categories={menuData.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
              <SubcategorySidebar 
                subcategories={menuData.subcategories[selectedCategory]}
                selectedSubcategory={selectedSubcategory}
                onSelectSubcategory={setSelectedSubcategory}
              />
              <div className="flex-1">
                {/* Mobile Subcategory Selector */}
                <div className="lg:hidden mb-4 overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex gap-2">
                    {menuData.subcategories[selectedCategory]?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-all ${
                          selectedSubcategory === sub.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">
                  {menuData.subcategories[selectedCategory]?.find(s => s.id === selectedSubcategory)?.name}
                </h2>
                <ProductGrid 
                  products={filteredProducts}
                  onAddToCart={addToCart}
                  onProductClick={handleProductClick}
                  onCursorHover={setHovering}
                />
              </div>
            </div>
          </>
        } />
        <Route path="/orders" element={
          <>
            <Header 
              tableNumber={tableNumber}
              showSearch={false}
              onCartClick={() => setIsCartOpen(true)}
              cartCount={cart.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
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
              onCartClick={() => setIsCartOpen(true)}
              cartCount={cart.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onGroupOrderClick={() => setIsGroupOrderOpen(true)}
              onCursorHover={setHovering}
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
      </Routes>

      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        tableNumber={tableNumber}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        cartTotal={cartTotal}
        onPlaceOrder={handlePlaceOrder}
      />

      <ProductModal 
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
      />

      <FloatingCartButton 
        cartCount={cart.length}
        onClick={() => setIsCartOpen(true)}
      />

      <GroupOrderSheet
        isOpen={isGroupOrderOpen}
        onClose={() => setIsGroupOrderOpen(false)}
        onCreate={() => {
          setIsGroupOrderOpen(false)
          alert('Group order created!')
        }}
      />

      <BottomNav />
    </div>
  )
}

export default App
