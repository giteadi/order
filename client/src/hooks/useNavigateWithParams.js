import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Custom hook to navigate while preserving query parameters
 * Usage: const navigateWithParams = useNavigateWithParams()
 * navigateWithParams('/admin') -> navigates to /admin?restaurant=adarsh
 */
export const useNavigateWithParams = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navigateWithParams = (path, options = {}) => {
    // Get current query params
    const currentParams = new URLSearchParams(location.search)
    const queryString = currentParams.toString()
    
    // Build full path with preserved params
    const fullPath = queryString ? `${path}?${queryString}` : path
    
    navigate(fullPath, options)
  }

  return navigateWithParams
}

export default useNavigateWithParams
