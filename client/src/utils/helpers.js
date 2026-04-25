/**
 * Calculate cart total
 */
export function calculateCartTotal(items) {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format price without currency symbol
 */
export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN').format(amount)
}

/**
 * Generate unique session ID
 */
export function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Parse JSON safely
 */
export function safeJSONParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Throttle function
 */
export function throttle(fn, limit) {
  let inThrottle
  return (...args) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key]
    result[group] = result[group] || []
    result[group].push(item)
    return result
  }, {})
}

/**
 * Deep clone
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate phone (Indian)
 */
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))
}

/**
 * Truncate text
 */
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Slugify string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Calculate order totals with tax
 */
export function calculateOrderTotals(items, taxRate = 0.05) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Format date
 */
export function formatDate(date, options = {}) {
  const d = new Date(date)
  const defaultOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }
  return d.toLocaleDateString('en-IN', defaultOptions)
}

/**
 * Format time
 */
export function formatTime(date) {
  const d = new Date(date)
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Time ago
 */
export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutes ago'
  
  return 'Just now'
}

/**
 * Storage helpers (localStorage wrapper)
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  },
}

/**
 * Sleep/delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
