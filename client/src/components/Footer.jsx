import { Link, useLocation } from 'react-router-dom'

export const Footer = () => {
  const location = useLocation()
  const params = location.search

  const getLink = (path) => `${path}${params}`

  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-6 px-4 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-gray-500 text-xs">
          © {new Date().getFullYear()} Vishnu Hastkala Kendra. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <Link to={getLink('/privacy-policy')} className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link to={getLink('/terms')} className="hover:text-white transition-colors">
            Terms & Conditions
          </Link>
          <Link to={getLink('/refund-policy')} className="hover:text-white transition-colors">
            Refund & Cancellation
          </Link>
        </div>
      </div>
    </footer>
  )
}
