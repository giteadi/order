import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const HeroSection = () => {
  const heroRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)
  const subtitleRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text reveal animation on load
      gsap.from(textRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: 'power4.out'
      })

      gsap.from(subtitleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1.5,
        delay: 0.3,
        ease: 'power4.out'
      })

      // Scroll-based zoom animation
      gsap.to(imageRef.current, {
        scale: 1.5,
        rotation: 5,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        }
      })

      // Text parallax
      gsap.to(textRef.current, {
        y: -200,
        opacity: 0,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '50% top',
          scrub: 1,
        }
      })

      // Pin the hero section
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: 1,
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={heroRef} className="relative h-screen overflow-hidden bg-gradient-to-br from-white to-gray-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          ref={imageRef}
          className="text-[160px] sm:text-[220px] md:text-[360px] lg:text-[420px] opacity-10"
        >
          ☕
        </div>
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <h1 
          ref={textRef}
          className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold text-center bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent tracking-tight"
        >
          ArtHaus Café
        </h1>
        <p 
          ref={subtitleRef}
          className="mt-5 sm:mt-6 text-lg sm:text-xl md:text-2xl text-gray-600 text-center max-w-2xl"
        >
          Experience coffee like never before
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
