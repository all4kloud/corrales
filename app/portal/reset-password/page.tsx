"use client"

import React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.")
    }
  }, [token])

  const validatePassword = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validatePassword()) return

    setLoading(true)

    try {
      const response = await fetch("/api/portal/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/portal/login")
        }, 3000)
      } else {
        setError(data.error || "Failed to reset password")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token && !error) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-[#78716C]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#10294b] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#10294b] px-8 py-6">
            <h1 className="text-2xl font-serif font-bold text-white text-center">
              Create New Password
            </h1>
            <p className="text-[#E7E5E4] text-center text-sm mt-2">
              Choose a strong password for your account
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
                  Password Reset Successful!
                </h2>
                <p className="text-[#78716C] mb-6">
                  Your password has been updated. Redirecting to login...
                </p>
              </div>
            ) : error && !token ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-[#1C1917] mb-2">
                  Invalid Link
                </h2>
                <p className="text-[#78716C] mb-6">{error}</p>
                <Link href="/portal/forgot-password">
                  <Button className="bg-[#C9A962] hover:bg-[#B89952] text-white">
                    Request New Link
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#1C1917] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#78716C]" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#78716C] mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1C1917] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#78716C]" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
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
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-[#FDFBF7] px-8 py-4 border-t border-[#E7E5E4] text-center">
            <p className="text-xs text-[#78716C]">
              Remember your password?{" "}
              <Link href="/portal/login" className="text-[#C9A962] hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
