import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigateWithParams } from '../hooks/useNavigateWithParams'

const featuredItems = [
  { id: 1, name: 'Espresso', price: 120, image: '☕', description: 'Pure, bold, intense', category: 'espresso' },
  { id: 3, name: 'Cappuccino', price: 180, image: '☕', description: 'Rich espresso with frothy milk', category: 'espresso' },
  { id: 101, name: 'Pancakes', price: 180, image: '🥞', description: 'Fluffy with maple syrup', category: 'breakfast' },
  { id: 301, name: 'Spaghetti Carbonara', price: 320, image: '🍝', description: 'Creamy Italian classic', category: 'pasta' },
  { id: 401, name: 'Margherita Pizza', price: 350, image: '🍕', description: 'Classic tomato & mozzarella', category: 'pizza' },
  { id: 501, name: 'Classic Burger', price: 280, image: '🍔', description: 'Beef patty with all fixings', category: 'burgers' },
  { id: 201, name: 'Club Sandwich', price: 250, image: '🥪', description: 'Triple decker classic', category: 'sandwiches' },
  { id: 701, name: 'Chocolate Cake', price: 180, image: '🍰', description: 'Rich chocolate layers', category: 'desserts' },
]

export const FeaturedItemsSection = ({ onProductClick, onAddToCart, onCursorHover }) => {
  const navigate = useNavigateWithParams()
  const sectionRef = useRef(null)

  const handleItemClick = (item) => {
    onProductClick({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      description: item.description
    })
  }

  const handleViewMenu = () => {
    navigate('/menu')
  }

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

        {/* Desktop: Grid View */}
        <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onMouseEnter={() => onCursorHover(true)}
              onMouseLeave={() => onCursorHover(false)}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 cursor-pointer transition-shadow"
            >
              <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 grid place-items-center text-5xl">
                {item.image}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-base text-gray-900 mb-1 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToCart({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                        description: item.description
                      })
                    }}
                    className="w-9 h-9 rounded-full bg-gray-900 text-white grid place-items-center hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Compact List View */}
        <div className="sm:hidden flex flex-col gap-3">
          {featuredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50"
            >
              <div className="flex items-center gap-3 p-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl grid place-items-center text-2xl">
                  {item.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                  <span className="text-base font-bold text-gray-900 mt-1 block">₹{item.price}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToCart({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      description: item.description
                    })
                  }}
                  className="w-10 h-10 rounded-full bg-gray-900 text-white grid place-items-center flex-shrink-0 active:scale-90 transition-transform"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </motion.div>
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
            onClick={handleViewMenu}
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
