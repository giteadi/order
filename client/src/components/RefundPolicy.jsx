import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Footer } from './Footer'

export const RefundPolicy = () => {
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">

          {/* Razorpay-compliant section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium">This policy applies to all payments made through our platform including subscription plans and food orders.</p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Subscription Refunds</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Within 24 hours of purchase:</strong> Full refund if the subscription has not been used to access any premium features.</li>
              <li><strong>After 24 hours:</strong> No refund will be issued for subscription fees. The subscription will remain active until the end of the billing period.</li>
              <li><strong>Technical issues:</strong> If you are unable to access the service due to a technical issue on our end, a pro-rated refund may be issued after investigation.</li>
              <li><strong>Duplicate payments:</strong> If you are charged twice for the same subscription, the duplicate charge will be fully refunded within 5-7 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Food Order Cancellations</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Before order confirmation:</strong> Orders can be cancelled freely before the restaurant confirms the order.</li>
              <li><strong>After confirmation:</strong> Cancellation is subject to restaurant approval. Contact the restaurant directly.</li>
              <li><strong>Prepared orders:</strong> Orders that have already been prepared cannot be cancelled or refunded.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Refund Process</h2>
            <p>Approved refunds will be processed within <strong>5-7 business days</strong> to the original payment method. UPI refunds are typically processed within 2-3 business days depending on your bank.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Non-Refundable Items</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Subscription fees after 24 hours of activation</li>
              <li>Food orders that have been prepared or delivered</li>
              <li>Promotional or discounted plans</li>
              <li>One-time setup fees (if applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. How to Request a Refund</h2>
            <p>To request a refund, please contact us with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your registered email or phone number</li>
              <li>Transaction ID / Order ID</li>
              <li>Reason for refund request</li>
              <li>Screenshot of payment (if available)</li>
            </ul>
            <p className="mt-3">Email: <a href="mailto:support@vishnuhastkalakendra.com" className="text-purple-600 hover:underline">support@vishnuhastkalakendra.com</a></p>
            <p>We will respond within <strong>2 business days</strong>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Disputes</h2>
            <p>If you believe you have been incorrectly charged, please contact us immediately. We are committed to resolving all payment disputes fairly and promptly. Unresolved disputes may be escalated to your payment provider.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Contact Us</h2>
            <p>For refund requests or payment queries:</p>
            <p className="mt-1">📧 <a href="mailto:support@vishnuhastkalakendra.com" className="text-purple-600 hover:underline">support@vishnuhastkalakendra.com</a></p>
            <p>📞 +91 9516696009</p>
            <p>🕐 Response time: Within 2 business days</p>
          </section>

        </div>
      </div>
      <Footer />
    </div>
  )
}
