import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'
import { menuAPI } from '../services/api'
import { ProductCard } from './ProductCard'

export const FeaturedItemsSection = ({ onProductClick, onAddToCart, onCursorHover }) => {
  const navigate = useNavigateWithParams()
  const sectionRef = useRef(null)
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await menuAPI.getMenu()
        if (res.data.success) {
          const menuData = res.data.data || []
          const allProducts = []
          menuData.forEach(category => {
            if (category.subcategories) {
              category.subcategories.forEach(sub => {
                if (sub.products) {
                  sub.products.forEach(p => {
                    allProducts.push({
                      ...p,
                      image: p.imageUrl || p.image_url || p.emojiIcon || p.emoji_icon || '🍽️',
                    })
                  })
                }
              })
            }
          })
          setFeaturedItems(allProducts.slice(0, 8))
        }
      } catch (e) {
        console.error('Failed to fetch featured items', e)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </section>
    )
  }

  if (featuredItems.length === 0) return null

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-full mb-4">
            Popular Dishes
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Order Your Favorites
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Scan, browse, and order directly from your table. Quick and easy!
          </p>
        </motion.div>

        {/* Same ProductCard as menu page — handles half/full inline popup automatically */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {featuredItems.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onAddToCart={onAddToCart}
              onClick={() => onProductClick(item)}
              onCursorHover={onCursorHover}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10 sm:mt-12"
        >
          <button
            onClick={() => navigate('/menu')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            View Full Menu
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
