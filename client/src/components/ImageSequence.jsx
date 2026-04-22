import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const ImageSequence = ({ images, containerRef }) => {
  const canvasRef = useRef(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const contextRef = useRef(null)
  const imagesRef = useRef([])

  useEffect(() => {
    // Load all images
    const loadImages = async () => {
      const loadedImages = []
      for (let i = 0; i < images.length; i++) {
        const img = new Image()
        img.src = images[i]
        await new Promise((resolve) => {
          img.onload = resolve
        })
        loadedImages.push(img)
      }
      imagesRef.current = loadedImages
    }

    loadImages()
  }, [images])

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    contextRef.current = ctx

    // Set canvas size
    canvas.width = 800
    canvas.height = 600

    const totalFrames = images.length

    // ScrollTrigger for frame-by-frame animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      }
    })

    // Animate through frames
    for (let i = 0; i < totalFrames; i++) {
      tl.to({}, {
        onStart: () => {
          setCurrentFrame(i)
          if (imagesRef.current[i]) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(imagesRef.current[i], 0, 0, canvas.width, canvas.height)
          }
        }
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [containerRef, images])

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full object-cover"
    />
  )
}

// Simplified version using emoji frames for demo
export const EmojiSequence = ({ emojis = ['☕', '🫖', '🥛', '🍶', '☕'] }) => {
  const containerRef = useRef(null)
  const emojiRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Frame-by-frame emoji animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        }
      })

      emojis.forEach((emoji, i) => {
        tl.to(emojiRef.current, {
          textContent: emoji,
          duration: 0.1,
        })
      })

      // Scale animation
      gsap.to(emojiRef.current, {
        scale: 2,
        rotation: 360,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        }
      })

      // Text reveal
      gsap.from(textRef.current, {
        y: 100,
        opacity: 0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
          end: 'top 50%',
          scrub: 1,
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [emojis])

  return (
    <section 
      ref={containerRef}
      className="min-h-[150vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900"
    >
      <div className="text-center">
        <div 
          ref={emojiRef}
          className="text-[150px] md:text-[250px] transition-transform"
        >
          {emojis[0]}
        </div>
        <p 
          ref={textRef}
          className="mt-8 text-2xl md:text-4xl font-bold text-gray-900 dark:text-white"
        >
          Crafted with precision
        </p>
      </div>
    </section>
  )
}
