import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const ParallaxSection = ({ children, speed = 0.5 }) => {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!mounted || isMobile || !sectionRef.current) return

    const ctx = gsap.context(() => {
      // Parallax effect - background moves slower than foreground
      gsap.to(contentRef.current, {
        y: () => ScrollTrigger.maxScroll(window) * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [speed, mounted, isMobile])

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div ref={contentRef} className="relative">
        {children}
      </div>
    </section>
  )
}

export const MultiLayerParallax = () => {
  const sectionRef = useRef(null)
  const bgRef = useRef(null)
  const midRef = useRef(null)
  const fgRef = useRef(null)
  const textRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!mounted || isMobile || !sectionRef.current) return

    console.log('🎬 MultiLayerParallax: Initializing GSAP')

    const ctx = gsap.context(() => {
      // Background layer - slowest
      gsap.to(bgRef.current, {
        y: -200,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Middle layer - medium speed
      gsap.to(midRef.current, {
        y: -100,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Foreground layer - fastest
      gsap.to(fgRef.current, {
        y: 100,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Text stays centered
      gsap.to(textRef.current, {
        y: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        }
      })
    }, sectionRef)

    return () => {
      console.log('🧹 MultiLayerParallax: Cleaning up')
      ctx.revert()
    }
  }, [mounted, isMobile])

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-950 to-black grid place-items-center"
    >
      {/* Background layer */}
      <div 
        ref={bgRef}
        className="absolute inset-0 opacity-60 pointer-events-none"
      >
        <img
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80"
          alt="Cafe"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Middle layer */}
      <div 
        ref={midRef}
        className="absolute inset-0 grid place-items-center opacity-35 pointer-events-none"
      >
        <img
          src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1200&q=80"
          alt="Coffee"
          className="w-[85%] max-w-5xl h-[60%] object-cover rounded-[48px] blur-[1px]"
          loading="lazy"
        />
      </div>

      {/* Foreground layer */}
      <div 
        ref={fgRef}
        className="absolute inset-0 grid items-end justify-center pb-16 opacity-70 pointer-events-none"
      >
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80"
          alt="Latte"
          className="w-[520px] max-w-[92%] h-[320px] object-cover rounded-[42px] shadow-2xl"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div 
        ref={textRef}
        className="relative z-10 h-full grid place-items-center px-4"
      >
        <div className="grid gap-4 sm:gap-6 text-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
            Depth in Motion
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-white/80 drop-shadow">
            Experience multi-layer parallax
          </p>
        </div>
      </div>
    </section>
  )
}
