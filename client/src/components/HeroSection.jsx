import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const heroImages = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=80',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1920&q=80'
]

export const HeroSection = () => {
  const heroRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)
  const subtitleRef = useRef(null)
  const [currentImage, setCurrentImage] = useState(0)

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

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=120%',
          scrub: true,
          pin: true,
          anticipatePin: 1,
        }
      })

      tl.to(imageRef.current, {
        scale: 1.2,
        filter: 'brightness(0.6) blur(8px)',
        ease: 'none'
      }, 0)

      tl.to(subtitleRef.current, {
        opacity: 0,
        y: -50,
        ease: 'none'
      }, 0)

      tl.to(textRef.current, {
        scale: 10,
        transformOrigin: 'center center',
        ease: 'none'
      }, 0)

      tl.to(textRef.current, {
        opacity: 0,
        ease: 'none'
      }, 0.85)
    }, heroRef)

    return () => ctx.revert()
  }, [])

  // Auto-rotate images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section ref={heroRef} className="relative h-screen overflow-hidden">
      {/* Background Image Carousel */}
      <div ref={imageRef} className="absolute inset-0 w-full h-full">
        {heroImages.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              idx === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt={`Hero ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Image Indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentImage(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === currentImage ? 'w-8 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <h1 
          ref={textRef}
          className="text-6xl sm:text-7xl md:text-9xl font-bold text-center text-white tracking-tight leading-[0.95] drop-shadow-lg will-change-transform"
        >
          ArtHaus Café
        </h1>
        <p 
          ref={subtitleRef}
          className="mt-5 sm:mt-6 text-lg sm:text-xl md:text-2xl text-white/90 text-center max-w-2xl drop-shadow-md"
        >
          Experience coffee like never before
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20">
        <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
