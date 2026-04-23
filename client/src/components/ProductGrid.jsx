import { motion } from 'framer-motion'
import { ProductCard } from './ProductCard'
import { AnimatePresence } from 'framer-motion'

export const ProductGrid = ({ products, onAddToCart, onProductClick, onCursorHover }) => {
  return (
    <motion.main 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex-1"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <AnimatePresence>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onClick={() => onProductClick(product)}
              onCursorHover={onCursorHover}
              transition={{ delay: index * 0.1 }}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
