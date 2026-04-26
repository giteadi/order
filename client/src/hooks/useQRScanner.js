import { useState, useEffect } from 'react'

/**
 * Parse QR code data from scanned QR
 * Format: restaurant:subdomain,table:tableNumber,code:XXX,ts:timestamp
 * Or URL format: subdomain.localhost/table/5
 */
export const useQRScanner = () => {
  const [scannedData, setScannedData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const parseQRData = () => {
      try {
        // Get URL parameters (for URL-based scanning)
        const urlParams = new URLSearchParams(window.location.search)
        const restaurantFromUrl = urlParams.get('restaurant')
        const tableFromUrl = urlParams.get('table')
        
        if (restaurantFromUrl && tableFromUrl) {
          setScannedData({
            restaurant: restaurantFromUrl,
            tableNumber: tableFromUrl,
            type: 'url'
          })
          return
        }

        // Check path format: /table/5 or /arthaus/table/5
        const path = window.location.pathname
        const pathParts = path.split('/').filter(p => p)
        
        // Format: /table/5 (from QR URL)
        if (pathParts.length >= 2 && pathParts[0] === 'table') {
          const tableNum = pathParts[1]
          if (!isNaN(tableNum)) {
            // Get restaurant from subdomain or query param
            const host = window.location.host
            const subdomain = host.split('.')[0]
            
            setScannedData({
              restaurant: subdomain !== 'localhost' && subdomain !== '127' ? subdomain : 'default',
              tableNumber: tableNum,
              type: 'path'
            })
            return
          }
        }

        // Format: /arthaus/table/5
        if (pathParts.length >= 3 && pathParts[1] === 'table') {
          const restaurant = pathParts[0]
          const tableNum = pathParts[2]
          
          if (!isNaN(tableNum)) {
            setScannedData({
              restaurant: restaurant,
              tableNumber: tableNum,
              type: 'fullpath'
            })
            return
          }
        }

        // If no QR data found, clear
        setScannedData(null)
      } catch (err) {
        setError(err.message)
        setScannedData(null)
      }
    }

    parseQRData()
  }, [window.location.pathname, window.location.search])

  return { scannedData, error }
}

/**
 * Parse raw QR code string
 * @param {string} qrString - Raw QR code data
 * @returns {object} - Parsed data { restaurant, tableNumber, code, timestamp }
 */
export const parseQRString = (qrString) => {
  try {
    if (!qrString) return null

    // Check if it's new format: restaurant:arthaus,table:5,code:XXX,ts:timestamp
    if (qrString.includes('restaurant:')) {
      const parts = qrString.split(',')
      const data = {}
      
      parts.forEach(part => {
        const [key, value] = part.split(':')
        if (key && value) {
          data[key.trim()] = value.trim()
        }
      })

      return {
        restaurant: data.restaurant || 'default',
        tableNumber: data.table,
        code: data.code,
        timestamp: data.ts,
        type: 'newformat'
      }
    }

    // Check if it's old format: TABLE_5_123456 or ART-5-XXX
    if (qrString.startsWith('TABLE_') || qrString.startsWith('ART-')) {
      const parts = qrString.split('_')
      if (parts.length >= 2) {
        return {
          restaurant: 'default',
          tableNumber: parts[1],
          type: 'oldformat'
        }
      }
    }

    return null
  } catch (err) {
    console.error('QR parse error:', err)
    return null
  }
}

/**
 * Generate QR code URL for table
 * @param {string} restaurant - Restaurant subdomain
 * @param {number} tableNumber - Table number
 * @returns {string} - Full URL for QR code
 */
export const generateQRUrl = (restaurant, tableNumber) => {
  const port = window.location.port ? `:${window.location.port}` : ''
  return `http://${restaurant}.localhost${port}/table/${tableNumber}`
}
