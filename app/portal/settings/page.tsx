"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, User, Bell } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSelector } from "@/components/portal/language-selector"
import { useTranslations } from "@/hooks/use-translations"

interface CustomerUser {
  id: string
  email: string
  firstName: string
  lastName: string
  customerId: string
  smsNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  preferredLanguage?: string
}

export default function PortalSettingsPage() {
  const router = useRouter()
  const { t, loading: translationsLoading } = useTranslations()
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/portal/auth/me")
      if (!response.ok) {
        router.push("/portal/login")
        return
      }
      const data = await response.json()
      setUser(data.user)
    } catch {
      router.push("/portal/login")
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = async (field: 'smsNotificationsEnabled' | 'emailNotificationsEnabled', value: boolean) => {
    if (!user) return
    
    // Optimistically update UI
    setUser({ ...user, [field]: value })
    setNotificationMessage(null)
    setSavingNotifications(true)
    
    try {
      const response = await fetch("/api/portal/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smsNotificationsEnabled: field === 'smsNotificationsEnabled' ? value : user.smsNotificationsEnabled,
          emailNotificationsEnabled: field === 'emailNotificationsEnabled' ? value : user.emailNotificationsEnabled,
        }),
      })

      if (!response.ok) {
        // Revert on error
        setUser({ ...user, [field]: !value })
        setNotificationMessage({ type: "error", text: t("settings.errorSavingNotifications") })
      } else {
        setNotificationMessage({ type: "success", text: t("settings.notificationsSaved") })
      }
    } catch {
      setUser({ ...user, [field]: !value })
      setNotificationMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: t("settings.passwordsDoNotMatch") })
      return
    }

    if (passwords.newPassword.length < 8) {
      setMessage({ type: "error", text: t("settings.passwordRequirements") })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/portal/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error === "Current password is incorrect" ? t("settings.incorrectPassword") : data.error })
        return
      }

      setMessage({ type: "success", text: t("settings.passwordUpdated") })
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch {
      setMessage({ type: "error", text: t("common.error") })
    } finally {
      setSaving(false)
    }
  }

  if (loading || translationsLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#78716C] font-medium">{translationsLoading ? "Loading..." : t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E5E4] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/portal/dashboard" className="flex items-center gap-3">
              <Image src="/conecta-logo.png" alt="Conecta Logo" width={40} height={40} className="object-contain" />
              <div>
                <span className="text-xl font-serif text-[#10294b]">Conectare</span>
                <p className="text-xs text-[#78716C]">{t("common.customerPortal")}</p>
              </div>
            </Link>

            <Link
              href="/portal/dashboard"
              className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1E3A5F] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("settings.backToDashboard")}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-serif text-[#1E3A5F] mb-8">{t("settings.title")}</h1>

        {/* Profile Info */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm mb-8">
          <div className="px-6 py-5 border-b border-[#E7E5E4]">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#1E3A5F]" />
              <h2 className="text-xl font-serif text-[#1E3A5F]">{t("settings.profileInformation")}</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#78716C] mb-1">{t("settings.name")}</p>
                <p className="text-[#1C1917] font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#78716C] mb-1">{t("settings.email")}</p>
                <p className="text-[#1C1917] font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="mb-8">
          <LanguageSelector
            currentLanguage={user?.preferredLanguage || "es"}
            onLanguageChange={(lang) => setUser(user ? { ...user, preferredLanguage: lang } : null)}
          />
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm mb-8">
          <div className="px-6 py-5 border-b border-[#E7E5E4]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#1E3A5F]" />
              <h2 className="text-xl font-serif text-[#1E3A5F]">{t("settings.notificationPreferences")}</h2>
            </div>
          </div>
          <div className="p-6">
            {notificationMessage && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  notificationMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {notificationMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{notificationMessage.text}</p>
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={user?.emailNotificationsEnabled ?? false}
                  onChange={(e) => handleNotificationChange('emailNotificationsEnabled', e.target.checked)}
                  disabled={savingNotifications}
                  className="w-5 h-5 rounded border-[#E7E5E4] text-[#1E3A5F] focus:ring-[#C9A962] focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                />
                <div>
                  <p className="text-[#1C1917] font-medium">{t("settings.emailNotifications")}</p>
                  <p className="text-sm text-[#78716C]">{t("settings.emailNotificationsDesc")}</p>
                </div>
              </label>

              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={user?.smsNotificationsEnabled ?? false}
                  onChange={(e) => handleNotificationChange('smsNotificationsEnabled', e.target.checked)}
                  disabled={savingNotifications}
                  className="w-5 h-5 rounded border-[#E7E5E4] text-[#1E3A5F] focus:ring-[#C9A962] focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                />
                <div>
                  <p className="text-[#1C1917] font-medium">{t("settings.smsNotifications")}</p>
                  <p className="text-sm text-[#78716C]">{t("settings.smsNotificationsDesc")}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
          <div className="px-6 py-5 border-b border-[#E7E5E4]">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#1E3A5F]" />
              <h2 className="text-xl font-serif text-[#1E3A5F]">{t("settings.changePassword")}</h2>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="p-6">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-[#1C1917] mb-2">
                  {t("settings.currentPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-[#E7E5E4] focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent transition-colors"
                    placeholder={t("settings.currentPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1E3A5F]"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#1C1917] mb-2">
                  {t("settings.newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-[#E7E5E4] focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent transition-colors"
                    placeholder={t("settings.newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1E3A5F]"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#78716C]">{t("settings.passwordRequirements")}</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1C1917] mb-2">
                  {t("settings.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-[#E7E5E4] focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent transition-colors"
                    placeholder={t("settings.confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1E3A5F]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3 bg-[#1E3A5F] text-white font-medium rounded-lg hover:bg-[#152a45] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? `${t("common.save")}...` : t("settings.updatePassword")}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#1E3A5F]" />
              <span className="text-sm text-[#78716C]">© 2025 Transaction Pro. {t("footer.allRightsReserved")}.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#78716C]">
              <Link href="/portal/privacy" className="hover:text-[#1E3A5F] transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link href="/portal/terms" className="hover:text-[#1E3A5F] transition-colors">
                {t("footer.terms")}
              </Link>
              <Link href="/portal/dashboard" className="hover:text-[#1E3A5F] transition-colors">
                {t("footer.dashboard")}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
