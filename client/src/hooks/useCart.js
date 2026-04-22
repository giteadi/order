import { useState } from 'react'

export const useCart = () => {
  const [cart, setCart] = useState([])

  const addToCart = (product, qty = 1) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + qty }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: qty }])
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartTotal
  }
}
