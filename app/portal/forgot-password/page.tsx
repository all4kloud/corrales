"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/portal/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || "Failed to send reset link")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#10294b] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#10294b] px-8 py-6">
            <h1 className="text-2xl font-serif font-bold text-white text-center">
              Reset Password
            </h1>
            <p className="text-[#E7E5E4] text-center text-sm mt-2">
              We'll send you a link to reset your password
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#1C1917] mb-2">
                  Check Your Email
                </h2>
                <p className="text-[#78716C] mb-6">
                  If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <Link href="/portal/login">
                  <Button className="w-full bg-[#1E3A5F] hover:bg-[#10294b] text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1C1917] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#78716C]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-11 pr-4 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C9A962] hover:bg-[#B89952] text-white font-medium py-3 rounded-lg transition-colors"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="text-center">
                  <Link
                    href="/portal/login"
                    className="text-sm text-[#78716C] hover:text-[#1E3A5F] transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-[#FDFBF7] px-8 py-4 border-t border-[#E7E5E4] text-center">
            <p className="text-xs text-[#78716C]">
              Need help?{" "}
              <a href="mailto:info@conecta-re.com" className="text-[#C9A962] hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
