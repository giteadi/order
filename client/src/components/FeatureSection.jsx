import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const FeatureSection = ({ title, description, icon, direction = 'left' }) => {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const iconRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin section for scroll animation
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top center',
        end: '+=200%',
        pin: true,
        scrub: 1,
      })

      // Icon zoom animation
      gsap.fromTo(iconRef.current, 
        { scale: 0.5, rotation: -10 },
        {
          scale: 1.2,
          rotation: 10,
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
      <div className="max-w-6xl mx-auto flex items-center gap-12">
        <div 
          ref={iconRef}
          className="text-9xl md:text-[150px] flex-shrink-0"
        >
          {icon}
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
