export const CustomCursor = ({ cursorPosition, isCursorHovering }) => {
  return (
    <div 
      className={`fixed pointer-events-none z-50 rounded-full mix-blend-difference transition-transform duration-150 ${
        isCursorHovering ? 'w-12 h-12 -translate-x-1/2 -translate-y-1/2' : 'w-4 h-4 -translate-x-1/2 -translate-y-1/2'
      }`}
      style={{
        left: cursorPosition.x,
        top: cursorPosition.y,
        background: 'black'
      }}
    />
  )
}
