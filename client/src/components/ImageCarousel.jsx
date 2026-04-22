import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronLeft, ChevronRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const defaultImages = [
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80',
  'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1200&q=80',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&q=80'
]

export const ImageCarousel = ({ 
  images = defaultImages,
  title = "Our Coffee Collection",
  autoPlay = true,
  interval = 4000
}) => {
  const containerRef = useRef(null)
  const carouselRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return
    const timer = setInterval(nextSlide, interval)
    return () => clearInterval(timer)
  }, [isAutoPlaying, interval, images.length])

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const promises = images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.src = src
          img.onload = resolve
          img.onerror = resolve
        })
      })
      await Promise.all(promises)
      setImagesLoaded(true)
    }
    loadImages()
  }, [images])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(carouselRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  if (images.length === 0) return null

  return (
    <section 
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 text-center">
          {title}
        </h2>
        
        <div 
          ref={carouselRef}
          className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl bg-gray-800"
        >
          {!imagesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                idx === currentIndex && imagesLoaded
                  ? 'opacity-100' 
                  : 'opacity-0'
              }`}
            >
              <img
                src={img}
                alt={`Slide ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
            </div>
          ))}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => {
                  prevSlide()
                  setIsAutoPlaying(false)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  nextSlide()
                  setIsAutoPlaying(false)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx)
                      setIsAutoPlaying(false)
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? 'w-8 bg-white' 
                        : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
