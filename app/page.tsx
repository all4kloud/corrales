import Image from "next/image"
import Link from "next/link"

export const metadata = {
  title: "Conectare - Simplifying Your Real Estate Transactions",
  description:
    "Conectare is focused on creating a space that eases communication between clients, customers, and agents and reducing time wasted during Transaction Coordination",
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f7f7]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image src="/conecta-logo.png" alt="Conecta" width={40} height={40} className="object-contain" />
              <span className="text-2xl font-serif text-[#10294b]">Conectare</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#about" className="text-[#10294b] hover:text-[#e8a522] transition-colors">
                About
              </Link>
              <Link href="#pricing" className="text-[#10294b] hover:text-[#e8a522] transition-colors">
                Pricing
              </Link>
              <Link href="#blog" className="text-[#10294b] hover:text-[#e8a522] transition-colors">
                Blog
              </Link>
            </nav>

            {/* Contact Us Button */}
            <Link
              href="/login"
              className="bg-[#e8a522] hover:bg-[#cf9429] text-white px-6 py-2 rounded-full transition-colors font-medium"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center min-h-[calc(100vh-200px)]">
          {/* Left Side - Image */}
          <div className="relative h-full min-h-[500px]">
            <Image
              src="/img_portal.avif"
              alt="Real Estate Professionals"
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>

          {/* Right Side - Content */}
          <div className="flex flex-col justify-center space-y-8 px-4 md:px-8">
            <h1 className="text-5xl md:text-6xl font-serif text-[#10294b] leading-tight">
              Simplifying
              <br />
              Your Real Estate
              <br />
              Transactions
            </h1>

            <p className="text-lg text-[#10294b] leading-relaxed">
              Conectare is focused on creating a space that eases communication between clients, customers, and agents and
              reducing time wasted during Transaction Coordination so agents can focus on what matters: lead generation,
              deal negotiation, and client relationship building
            </p>

            {/* Get Started Button - links to login */}
            <div>
              <Link
                href="/login"
                className="inline-block bg-[#e8a522] hover:bg-[#cf9429] text-white px-12 py-4 rounded-full transition-colors font-medium text-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
