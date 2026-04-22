import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Plus } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export const ScrollProductCard = ({ product, onAddToCart, onClick, index }) => {
  const cardRef = useRef(null)
  const imageRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Staggered reveal on scroll
      gsap.from(cardRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      })

      // Image zoom on scroll
      gsap.to(imageRef.current, {
        scale: 1.1,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Parallax text
      gsap.to(textRef.current, {
        y: -20,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      })
    }, cardRef)

    return () => ctx.revert()
  }, [])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-card rounded-3xl overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
        <div 
          ref={imageRef}
          className="text-6xl transition-transform duration-700"
        >
          {product.image}
        </div>
      </div>
      <div 
        ref={textRef}
        className="p-6"
      >
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white flex items-center justify-center"
          >
            <Plus size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
