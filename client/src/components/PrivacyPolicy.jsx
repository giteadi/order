import { ArrowLeft } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Footer } from './Footer'

export const PrivacyPolicy = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as your name, email address, phone number, and payment information when you register or use our services. We also collect usage data including order history, device information, and browsing activity on our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and fulfill your orders</li>
              <li>To manage your account and subscription</li>
              <li>To send order confirmations and service updates</li>
              <li>To improve our platform and services</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Payment Information</h2>
            <p>We use UPI-based payment processing. Payment transactions are processed through secure UPI infrastructure. We do not store your UPI PIN or full payment credentials. Transaction IDs are stored for verification and dispute resolution purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Data Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share data with service providers who assist in operating our platform, subject to confidentiality agreements. We may disclose information when required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Data Security</h2>
            <p>We implement industry-standard security measures including SSL encryption, secure database storage, and access controls to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Cookies</h2>
            <p>We use cookies and similar technologies to maintain your session, remember your preferences, and improve your experience. You can control cookie settings through your browser.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the email below. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Contact Us</h2>
            <p>For privacy-related queries, contact us at: <a href="mailto:support@vishnuhastkalakendra.com" className="text-purple-600 hover:underline">support@vishnuhastkalakendra.com</a></p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  )
}
