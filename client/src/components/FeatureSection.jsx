import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const FeatureSection = ({ title, description, icon, images = [], direction = 'left' }) => {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const iconRef = useRef(null)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [images])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin section for scroll animation
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=120%',
        pin: true,
        pinSpacing: false,
        scrub: 1,
      })

      // Image zoom animation
      gsap.fromTo(iconRef.current, 
        { scale: 0.8, rotation: -5 },
        {
          scale: 1,
          rotation: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
          }
        }
      )

      // Content slide in
      gsap.from(contentRef.current, {
        x: direction === 'left' ? -100 : 100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      })

      // Text reveal line by line
      gsap.from(contentRef.current.querySelectorAll('h2, p'), {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        }
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [direction])

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div 
          ref={iconRef}
          className="w-64 h-64 md:w-96 md:h-96 flex-shrink-0 rounded-3xl overflow-hidden shadow-2xl"
        >
          {images.length > 0 ? (
            <div className="relative w-full h-full">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={title}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    idx === currentImage ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImage ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-9xl md:text-[150px]">{icon}</span>
          )}
        </div>
        <div 
          ref={contentRef}
          className="flex-1"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </section>
  )
}
