import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Footer } from './Footer'

export const TermsAndConditions = () => {
  const navigate = useNavigate()

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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using the Vishnu Hastkala Kendra platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Use of Services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 18 years old to use this platform</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You agree not to misuse the platform or attempt unauthorized access</li>
              <li>Restaurant admins are responsible for the accuracy of their menu and pricing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Subscription Services</h2>
            <p>Restaurant management features require an active subscription. Subscriptions are billed in advance on a monthly, quarterly, or annual basis. Access to premium features is contingent on maintaining an active subscription.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Orders & Payments</h2>
            <p>All orders placed through the platform are subject to restaurant acceptance. Prices displayed are inclusive of applicable taxes unless stated otherwise. Payment must be completed at the time of ordering.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Intellectual Property</h2>
            <p>All content, trademarks, and intellectual property on this platform belong to Vishnu Hastkala Kendra or its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Limitation of Liability</h2>
            <p>We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount paid by you in the last 3 months.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Modifications</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Madhya Pradesh, India.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Contact</h2>
            <p>For any queries regarding these terms: <a href="mailto:support@vishnuhastkalakendra.com" className="text-purple-600 hover:underline">support@vishnuhastkalakendra.com</a></p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  )
}
