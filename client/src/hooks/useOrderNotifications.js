import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { selectSessionId } from '../store/slices/cartSlice'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const STATUS_CONFIG = {
  confirmed: { emoji: '✅', title: 'Order Confirmed!', message: 'Your order has been accepted by the kitchen.', bg: '#10B981' },
  preparing: { emoji: '👨‍🍳', title: 'Being Prepared', message: 'The kitchen is preparing your order.', bg: '#F59E0B' },
  ready:     { emoji: '🔔', title: 'Order Ready!', message: 'Your order is ready. Please collect it.', bg: '#3B82F6' },
  served:    { emoji: '🍽️', title: 'Order Served', message: 'Enjoy your meal!', bg: '#8B5CF6' },
  completed: { emoji: '🎉', title: 'Order Completed', message: 'Thank you for dining with us!', bg: '#6366F1' },
  cancelled: { emoji: '❌', title: 'Order Cancelled', message: 'Your order has been cancelled. Please contact staff.', bg: '#EF4444' },
}

export function useOrderNotifications() {
  const sessionId = useSelector(selectSessionId)
  const esRef = useRef(null)
  const reconnectTimer = useRef(null)

  useEffect(() => {
    if (!sessionId) return

    // Don't connect on admin pages
    const path = window.location.pathname
    if (path.startsWith('/admin') || path.startsWith('/super-admin')) return

    const connect = () => {
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }

      const url = `${API_BASE}/orders/events?sessionId=${encodeURIComponent(sessionId)}`
      const es = new EventSource(url)
      esRef.current = es

      es.addEventListener('connected', () => {
        console.log('[OrderNotifications] SSE connected, sessionId:', sessionId)
      })

      es.addEventListener('order_status', (e) => {
        try {
          const { status, tableNumber } = JSON.parse(e.data)
          const cfg = STATUS_CONFIG[status]
          if (!cfg) return

          const tableText = tableNumber ? `\nTable ${tableNumber}` : ''

          toast(
            `${cfg.emoji}  ${cfg.title}\n${cfg.message}${tableText}`,
            {
              duration: status === 'cancelled' ? 8000 : 5000,
              position: 'top-center',
              style: {
                background: cfg.bg,
                color: '#fff',
                padding: '14px 18px',
                borderRadius: '14px',
                maxWidth: '340px',
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              },
            }
          )
        } catch (err) {
          console.warn('[OrderNotifications] Failed to parse event', err)
        }
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        reconnectTimer.current = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer.current)
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [sessionId])
}
