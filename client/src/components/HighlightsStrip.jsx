import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import apiClient from '../services/api'

gsap.registerPlugin(ScrollTrigger)

const defaultHighlights = [
  {
    title: 'Single-Origin Beans',
    subtitle: 'Fresh roasted. Bold flavor.',
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80'
  },
  {
    title: 'Latte Art',
    subtitle: 'Crafted by baristas.',
    image: 'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=1200&q=80'
  },
  {
    title: 'Cold Brew',
    subtitle: 'Smooth. Slow steeped.',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&q=80'
  },
  {
    title: 'Cafe Vibes',
    subtitle: 'Work. Chill. Repeat.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80'
  }
]

export const HighlightsStrip = ({
  title = 'Get the highlights.',
  highlights = defaultHighlights
}) => {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [carouselImages, setCarouselImages] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch carousel images from API
  useEffect(() => {
    const fetchCarouselImages = async () => {
      // Fetch carousel images for highlights strip
      const carouselRes = await apiClient.get('/carousel?type=highlights')
      if (carouselRes.data.success && carouselRes.data.data.length > 0) {
        // Transform API data to component format
        const formattedImages = carouselRes.data.data.map(img => ({
          title: img.title,
          subtitle: img.subtitle || '',
          image: img.thumbnail || img.image_base64  // thumbnail from API
        })).filter(img => img.image)
        setCarouselImages(formattedImages)
      }
    }

    fetchCarouselImages()
  }, [])

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!mounted || isMobile || !sectionRef.current) return

    console.log('🎬 HighlightsStrip: Initializing GSAP')

    const ctx = gsap.context(() => {
      gsap.from(trackRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      })
    }, sectionRef)

    return () => {
      console.log('🧹 HighlightsStrip: Cleaning up')
      ctx.revert()
    }
  }, [mounted, isMobile])

  return (
    <section ref={sectionRef} className="py-10 md:py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-[1fr_auto] items-end gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          <div className="text-xs sm:text-sm text-gray-500 hidden md:block">Scroll</div>
        </div>

        <div
          ref={trackRef}
          className="grid grid-flow-col auto-cols-[280px] sm:auto-cols-[360px] md:auto-cols-[420px] gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {(carouselImages.length > 0 ? carouselImages : highlights).map((h, idx) => (
            <article
              key={idx}
              className="min-w-[280px] sm:min-w-[360px] md:min-w-[420px] h-[340px] md:h-[380px] rounded-3xl overflow-hidden relative snap-start shadow-lg bg-gray-200"
            >
              <img
                src={h.image}
                alt={h.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute left-5 right-5 bottom-5">
                <div className="text-white text-2xl md:text-3xl font-bold leading-tight">
                  {h.title}
                </div>
                <div className="mt-1 text-white/85 text-sm md:text-base">
                  {h.subtitle}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
