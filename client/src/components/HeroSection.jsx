import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectRestaurantName, fetchRestaurantBySubdomain } from '../store/slices/restaurantSlice'
import apiClient from '../services/api'

gsap.registerPlugin(ScrollTrigger)

// Fallback images if API fails or no images in database
const fallbackImages = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1920&q=80&auto=format&fit=crop'
]

const CarouselImage = ({ src, isActive }) => {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900 animate-pulse" />
      )}
      <img
        src={src}
        alt=""
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>
  )
}

export const HeroSection = () => {
  const heroRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)
  const subtitleRef = useRef(null)
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const restaurantName = useSelector(selectRestaurantName)
  const [currentImage, setCurrentImage] = useState(0)
  const [isMobile, setIsMobile] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [heroImages, setHeroImages] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch restaurant from Redux when URL param changes
  useEffect(() => {
    const restaurantFromUrl = searchParams.get('restaurant')
    if (restaurantFromUrl) {
      dispatch(fetchRestaurantBySubdomain(restaurantFromUrl))
    }
  }, [searchParams, dispatch])

  // Fetch hero images from API
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/carousel?type=hero')
        if (response.data.success && response.data.data.length > 0) {
          // thumbnail field is what the list API returns (optimized, small)
          const apiImages = response.data.data
            .map(img => img.thumbnail)
            .filter(Boolean)
          setHeroImages(apiImages.length > 0 ? apiImages : fallbackImages)
        } else {
          setHeroImages(fallbackImages)
        }
      } catch (error) {
        console.error('Failed to fetch hero images:', error)
        setHeroImages(fallbackImages)
      } finally {
        setLoading(false)
      }
    }

    fetchHeroImages()
  }, [])

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 1024)
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotate — sirf desktop pe
  useEffect(() => {
    if (!mounted || isMobile || heroImages.length === 0) return
    const timer = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [mounted, isMobile, heroImages])

  // GSAP — sirf desktop pe
  useEffect(() => {
    if (!mounted || isMobile || !heroRef.current) return

    console.log('🎬 HeroSection: Initializing GSAP animations')

    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
      )
      gsap.fromTo(subtitleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 0.2, ease: 'power3.out' }
      )

      // Scroll-based animations without pin (pin causes DOM issues on unmount)
      gsap.to(imageRef.current, {
        scale: 1.2,
        filter: 'brightness(0.6) blur(8px)',
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        }
      })

      gsap.to(subtitleRef.current, {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        }
      })

      gsap.to(textRef.current, {
        scale: 1.5,
        opacity: 0,
        transformOrigin: 'center center',
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
        }
      })
    }, heroRef)

    return () => {
      console.log('🧹 HeroSection: Cleaning up GSAP context')
      ctx.revert()
      console.log('✅ HeroSection: Cleanup complete')
    }
  }, [isMobile, mounted])

  // ✅ Mobile — alag static render
  if (isMobile) {
    const displayImage = heroImages.length > 0 ? heroImages[0] : fallbackImages[0]
    return (
      <section
        className="relative h-screen grid place-items-center"
        style={{ background: '#1a0a00' }}
      >
        {/* Sirf pehli image — static */}
        <div className="absolute inset-0 w-full h-full z-0">
          <CarouselImage src={displayImage} isActive={true} />
        </div>

        {/* Text — no animation, direct visible */}
        <div className="relative z-10 h-full grid place-items-center px-4">
          <div className="grid gap-5 text-center">
            <h1
              className="text-6xl sm:text-7xl font-bold tracking-tight leading-none"
              style={{
                color: 'transparent',
                WebkitTextStroke: '3px rgba(255,255,255,0.95)',
                textShadow: '0 0 60px rgba(255,255,255,0.4)'
              }}
            >
              {restaurantName}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl drop-shadow-md">
              Experience coffee like never before
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ✅ Desktop — full animation
  const displayImages = heroImages.length > 0 ? heroImages : fallbackImages
  return (
    <section
      ref={heroRef}
      className="relative h-screen grid place-items-center"
      style={{ background: '#1a0a00' }}
    >
      <div ref={imageRef} className="absolute inset-0 w-full h-full z-0 will-change-transform">
        {displayImages.map((src, idx) => (
          <CarouselImage key={idx} src={src} isActive={idx === currentImage} />
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 grid grid-flow-col auto-cols-max gap-2">
        {displayImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImage(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentImage ? 'w-8 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 h-full grid place-items-center px-4">
        <div className="grid gap-5 sm:gap-6 text-center">
          <h1
            ref={textRef}
            className="text-6xl sm:text-7xl md:text-9xl font-bold tracking-tight leading-none will-change-transform"
            style={{
              color: 'transparent',
              WebkitTextStroke: '3px rgba(255,255,255,0.95)',
              textShadow: '0 0 60px rgba(255,255,255,0.4), 0 0 100px rgba(255,255,255,0.2)'
            }}
          >
            {restaurantName}
          </h1>
          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-md will-change-transform"
          >
            Experience coffee like never before
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20">
        <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}