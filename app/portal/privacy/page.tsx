import { Building2 } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
        <h1 className="text-4xl font-serif text-[#1E3A5F] mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none text-[#44403C]">
          <p className="text-[#78716C] mb-8">Last updated: January 1, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">1. Introduction</h2>
            <p>
              Transaction Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our real estate
              transaction management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-[#1C1917] mb-3">Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Mailing address and property addresses</li>
              <li>Financial information related to real estate transactions</li>
              <li>Government-issued identification for verification purposes</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-xl font-medium text-[#1C1917] mb-3 mt-6">Automatically Collected Information</h3>
            <p>When you access our platform, we may automatically collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>To facilitate and manage real estate transactions</li>
              <li>To communicate with you about your transactions</li>
              <li>To send important updates, reminders, and notifications</li>
              <li>To improve our services and user experience</li>
              <li>To comply with legal and regulatory requirements</li>
              <li>To protect against fraud and unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Real estate agents and brokers involved in your transactions</li>
              <li>Title companies, lenders, and attorneys as necessary</li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="mt-4">We do not sell your personal information to third parties for marketing purposes.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information, including encryption, secure
              servers, and access controls. However, no method of transmission over the Internet is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Access and review your personal information</li>
              <li>Request corrections to inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">7. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to fulfill the purposes outlined in this policy,
              comply with legal obligations, and resolve disputes. Transaction records may be retained for up to seven
              years as required by real estate regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-serif text-[#1E3A5F] mb-4">8. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
            <div className="mt-4 p-4 bg-[#F5F0E8] rounded-lg">
              <p className="font-medium text-[#1E3A5F]">Transaction Pro</p>
              <p>Email: privacy@transactionpro.com</p>
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
              <Link href="/portal/privacy" className="text-[#1E3A5F] font-medium">
                Privacy
              </Link>
              <Link href="/portal/terms" className="hover:text-[#1E3A5F] transition-colors">
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
