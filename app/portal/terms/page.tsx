import { Building2 } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/portal" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3A5F] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#C9A962]" />
              </div>
              <span className="text-xl font-serif text-[#1E3A5F]">Transaction Pro</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif text-[#1E3A5F] mb-8">Terms of Service</h1>

        <div className="prose prose-lg max-w-none text-[#44403C]">
          <p className="text-[#78716C] mb-8">Last updated: January 1, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Transaction Pro's real estate transaction management platform ("Service"), you agree
              to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our
              Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">2. Description of Service</h2>
            <p>
              Transaction Pro provides a digital platform for managing real estate transactions, including but not
              limited to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Transaction tracking and management</li>
              <li>Document storage and organization</li>
              <li>Communication between parties</li>
              <li>Task and deadline management</li>
              <li>Progress monitoring and reporting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-medium text-[#1C1917] mb-3">Account Registration</h3>
            <p>
              To access certain features of our Service, you must register for an account. You agree to provide
              accurate, current, and complete information during registration and to update such information as
              necessary.
            </p>

            <h3 className="text-xl font-medium text-[#1C1917] mb-3 mt-6">Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities
              that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">4. User Responsibilities</h2>
            <p>As a user of our Service, you agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Provide accurate and truthful information</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Respect the rights of other users and parties</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
              <li>Not use the Service to transmit harmful or malicious content</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of our Service, including but not limited to text, graphics,
              logos, and software, are owned by Transaction Pro and protected by intellectual property laws. You may not
              reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">6. Limitation of Liability</h2>
            <p>
              Transaction Pro provides the Service "as is" and "as available." We make no warranties, express or
              implied, regarding the Service's reliability, availability, or suitability for your particular purposes.
            </p>
            <p className="mt-4">
              To the maximum extent permitted by law, Transaction Pro shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">7. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Transaction Pro, its officers, directors, employees, and agents
              from any claims, damages, losses, or expenses arising from your use of the Service or violation of these
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without
              cause, and with or without notice. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">9. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of significant changes by posting the updated
              Terms on our platform and updating the "Last updated" date. Your continued use of the Service after such
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Florida,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">11. Contact Information</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <div className="mt-4 p-4 bg-[#F5F0E8] rounded-lg">
              <p className="font-medium text-[#1E3A5F]">Transaction Pro</p>
              <p>Email: legal@transactionpro.com</p>
              <p>Phone: (555) 123-4567</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1E3A5F]" />
              <span className="text-sm text-[#78716C]">© 2025 Transaction Pro. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#78716C]">
              <Link href="/portal/privacy" className="hover:text-[#1E3A5F] transition-colors">
                Privacy
              </Link>
              <Link href="/portal/terms" className="text-[#1E3A5F] font-medium">
                Terms
              </Link>
              <Link href="/portal/dashboard" className="hover:text-[#1E3A5F] transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
