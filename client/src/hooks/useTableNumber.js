import { useState, useEffect } from 'react'

export const useTableNumber = () => {
  const [tableNumber, setTableNumber] = useState(null)

  useEffect(() => {
    const path = window.location.pathname
    const parts = path.split('/')
    const tableNum = parts[parts.length - 1]
    if (!isNaN(tableNum)) {
      setTableNumber(tableNum)
    } else {
      setTableNumber('1')
    }
  }, [])

  return tableNumber
}
