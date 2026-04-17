"use client"

import Link from "next/link"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials")
      }

      router.push("/portal/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1E3A5F]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/luxury-modern-home-exterior-architecture.jpg')" }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <Image src="/conecta-logo.png" alt="Conecta Logo" width={48} height={48} className="rounded-full" />
            <span className="text-2xl font-serif tracking-wide">Conectare</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-serif leading-tight">
              Your Property
              <br />
              <span className="text-[#C9A962]">Journey Awaits</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              Track your real estate transactions with elegance. Stay informed every step of the way.
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm text-white/60">
            <span>Trusted by thousands</span>
            <span className="w-px h-4 bg-white/30" />
            <span>Premium service</span>
            <span className="w-px h-4 bg-white/30" />
            <span>24/7 access</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Image src="/conecta-logo.png" alt="Conecta Logo" width={40} height={40} />
            <span className="text-xl font-serif text-[#1E3A5F]">Conectare</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-serif text-[#1E3A5F] mb-2">Welcome Back</h2>
            <p className="text-[#78716C]">Sign in to access your transaction portal</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1917]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#78716C]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-[#E7E5E4] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1C1917]">Password</label>
                <Link
                  href="/portal/forgot-password"
                  className="text-sm text-[#C9A962] hover:text-[#B89952] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#78716C]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-[#E7E5E4] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1E3A5F] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E3A5F] text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#152a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Portal
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-[#E7E5E4]">
            <p className="text-center text-sm text-[#78716C]">
              Need assistance?{" "}
              <a
                href="mailto:info@conecta-re.com"
                className="text-[#1E3A5F] font-medium hover:text-[#C9A962] transition-colors"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
