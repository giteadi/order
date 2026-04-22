import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const ParallaxSection = ({ children, speed = 0.5 }) => {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
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
  }, [speed])

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

  useEffect(() => {
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

    return () => ctx.revert()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900"
    >
      {/* Background layer */}
      <div 
        ref={bgRef}
        className="absolute inset-0 flex items-center justify-center text-[300px] opacity-5"
      >
        ☕
      </div>

      {/* Middle layer */}
      <div 
        ref={midRef}
        className="absolute inset-0 flex items-center justify-center text-[200px] opacity-10"
      >
        🫖
      </div>

      {/* Foreground layer */}
      <div 
        ref={fgRef}
        className="absolute inset-0 flex items-center justify-center text-[100px] opacity-20"
      >
        🥛
      </div>

      {/* Content */}
      <div 
        ref={textRef}
        className="relative z-10 h-full flex items-center justify-center px-4"
      >
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Depth in Motion
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
            Experience multi-layer parallax
          </p>
        </div>
      </div>
    </section>
  )
}
