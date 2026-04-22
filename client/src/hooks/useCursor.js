import { useState, useEffect } from 'react'

export const useCursor = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [isCursorHovering, setIsCursorHovering] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const setHovering = (hovering) => setIsCursorHovering(hovering)

  return { cursorPosition, isCursorHovering, setHovering }
}
