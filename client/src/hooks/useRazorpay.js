/**
 * useRazorpay Hook
 * Loads Razorpay script and exposes openPayment()
 *
 * Usage:
 *   const { openPayment, loading } = useRazorpay()
 *   openPayment({ amount, name, description, email, phone, onSuccess, onFailure })
 */

import { useState, useEffect } from 'react'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_DUMMYKEYID123456'

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function useRazorpay() {
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    loadScript(RAZORPAY_SCRIPT).then(setScriptLoaded)
  }, [])

  /**
   * Open Razorpay payment modal
   * @param {Object} options
   * @param {number}   options.amount       - Amount in INR (e.g. 299)
   * @param {string}   options.orderId      - Razorpay order ID from backend
   * @param {string}   options.name         - Business name shown in modal
   * @param {string}   options.description  - Payment description
   * @param {string}   options.email        - Prefill email
   * @param {string}   options.phone        - Prefill phone
   * @param {Function} options.onSuccess    - Called with razorpay response on success
   * @param {Function} options.onFailure    - Called with error on failure/dismiss
   */
  const openPayment = ({
    amount,
    orderId,
    name = 'Vishnu Hastkala Kendra',
    description = 'Subscription Plan',
    email = '',
    phone = '',
    onSuccess,
    onFailure,
  }) => {
    if (!scriptLoaded || !window.Razorpay) {
      console.error('Razorpay script not loaded')
      onFailure?.({ message: 'Payment gateway not available. Please try again.' })
      return
    }

    const options = {
      key: KEY_ID,
      amount: amount * 100,       // Razorpay expects paise
      currency: 'INR',
      order_id: orderId,          // From backend createOrder
      name,
      description,
      image: '/favicon.svg',
      prefill: {
        email,
        contact: phone,
      },
      theme: {
        color: '#7c3aed',         // Purple to match UI
      },
      modal: {
        ondismiss: () => {
          onFailure?.({ message: 'Payment cancelled by user' })
        },
      },
      handler: (response) => {
        // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        onSuccess?.(response)
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response) => {
      onFailure?.(response.error)
    })
    rzp.open()
  }

  return { openPayment, scriptLoaded }
}
