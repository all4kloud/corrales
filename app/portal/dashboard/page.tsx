"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Building2,
  LogOut,
  Home,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  FileText,
  TrendingUp,
  Settings,
  Download,
  ExternalLink,
  File,
} from "lucide-react"
import { NotificationsBell } from "../components/notifications-bell"
import { useTranslations } from "@/hooks/use-translations"

interface Transaction {
  id: string
  property_address: string
  property_city: string
  property_state: string
  transaction_type: string
  status: string
  purchase_price: number
  closing_date: string
  contract_date: string
  role: "buyer" | "seller"
}

interface FollowUp {
  id: string
  event_name: string
  due_date: string
  status: string
  priority: string
  transaction_id: string
}

interface Document {
  id: string
  file_name: string
  file_type: string
  file_size: number
  google_drive_url: string
  created_at: string
  transaction_id: string
  task_id: string | null
  property_address: string | null
  task_name: string | null
}

interface CustomerUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function PortalDashboardPage() {
  const router = useRouter()
  const { t, locale, loading: translationsLoading, translateStatus, translateRole } = useTranslations()
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchData()
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
    }
  }

  const fetchData = async () => {
    try {
      const [transactionsRes, followUpsRes, documentsRes] = await Promise.all([
        fetch("/api/portal/transactions"),
        fetch("/api/portal/follow-ups"),
        fetch("/api/portal/documents"),
      ])

      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }

      if (followUpsRes.ok) {
        const data = await followUpsRes.json()
        setFollowUps(data.followUps || [])
      }

      if (documentsRes.ok) {
        const data = await documentsRes.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/portal/auth/logout", { method: "POST" })
    router.push("/portal/login")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    // Append T00:00:00 to force local timezone parsing and avoid UTC off-by-one
    const normalized = dateString.includes("T") ? dateString : `${dateString}T00:00:00`
    return new Date(normalized).toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "closed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "pending":
      case "in_progress":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "active":
        return "bg-[#1E3A5F]/10 text-[#1E3A5F] border-[#1E3A5F]/20"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-amber-600"
      default:
        return "text-gray-600"
    }
  }

  const activeTransactions = transactions.filter((t) => t.status !== "closed")
  const completedTransactions = transactions.filter((t) => t.status === "closed")
  const upcomingTasks = followUps
    .filter((f) => f.status !== "completed" && f.status !== "not_applicable")
    .slice(0, 5)
  const recentDocuments = documents.slice(0, 10)

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/portal/dashboard" className="flex items-center gap-3">
              <Image src="/conecta-logo.png" alt="Conecta Logo" width={40} height={40} className="object-contain" />
              <div>
                <span className="text-xl font-serif text-[#10294b]">Conectare</span>
                <p className="text-xs text-[#78716C]">{t("common.customerPortal")}</p>
              </div>
            </Link>

            <div className="flex items-center gap-6">
              <NotificationsBell />
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#10294b]" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#10294b]">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-[#78716C]">{user?.email}</p>
                </div>
              </div>
              <Link
                href="/portal/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#78716C] hover:text-[#10294b] hover:bg-[#F5F0E8] rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t("common.settings")}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[#78716C] hover:text-[#10294b] hover:bg-[#F5F0E8] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t("auth.signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif text-[#10294b] mb-2">{t("dashboard.welcomeBack")}, {user?.firstName}</h1>
          <p className="text-[#78716C]">{t("dashboard.subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#10294b]/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-[#10294b]" />
              </div>
              <span className="text-2xl font-serif text-[#10294b]">{transactions.length}</span>
            </div>
            <p className="text-sm text-[#78716C]">{t("dashboard.totalTransactions")}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#C9A962]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#C9A962]" />
              </div>
              <span className="text-2xl font-serif text-[#10294b]">{activeTransactions.length}</span>
            </div>
            <p className="text-sm text-[#78716C]">{t("transactions.statusActive")}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-serif text-[#10294b]">{completedTransactions.length}</span>
            </div>
            <p className="text-sm text-[#78716C]">{t("transactions.statusCompleted")}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-2xl font-serif text-[#10294b]">{upcomingTasks.length}</span>
            </div>
            <p className="text-sm text-[#78716C]">{t("tasks.pending")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E7E5E4]">
                <h2 className="text-xl font-serif text-[#10294b]">{t("dashboard.yourTransactions")}</h2>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-[#78716C]" />
                  </div>
                  <p className="text-[#78716C]">{t("transactions.noTransactions")}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E5E4]">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-6 hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                      onClick={() => router.push(`/portal/transactions/${transaction.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-lg bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                            <Home className="w-8 h-8 text-[#10294b]" />
                          </div>
                          <div>
                            <h3 className="font-medium text-[#10294b] mb-1">
                              {transaction.property_address || "Property Address"}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-[#78716C] mb-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {transaction.property_city}, {transaction.property_state}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(transaction.status)}`}
                              >
                                {translateStatus(transaction.status)}
                              </span>
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#10294b]/10 text-[#10294b] border border-[#10294b]/20 capitalize">
                                {translateRole(transaction.role)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="text-lg font-serif text-[#10294b]">
                            {formatCurrency(transaction.purchase_price || 0)}
                          </p>
                          <p className="text-xs text-[#78716C] mt-1">{t("dashboard.closing")}: {formatDate(transaction.closing_date)}</p>
                          <ChevronRight className="w-5 h-5 text-[#78716C] mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div>
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E7E5E4]">
                <h2 className="text-xl font-serif text-[#10294b]">{t("dashboard.upcomingTasks")}</h2>
              </div>

              {upcomingTasks.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm text-[#78716C]">{t("dashboard.allCaughtUp")}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E5E4]">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-[#FDFBF7] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(task.priority)} bg-current`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#10294b] truncate">{task.event_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-[#78716C]" />
                            <span className="text-xs text-[#78716C]">{formatDate(task.due_date)}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                          {translateStatus(task.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-5 border-b border-[#E7E5E4]">
                <h2 className="text-xl font-serif text-[#10294b]">{t("dashboard.recentDocuments")}</h2>
              </div>

              {recentDocuments.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-[#78716C]" />
                  </div>
                  <p className="text-sm text-[#78716C]">{t("dashboard.noDocumentsYet")}</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E5E4]">
                  {recentDocuments.map((doc) => (
                    <div key={doc.id} className="p-4 hover:bg-[#FDFBF7] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                          <File className="w-5 h-5 text-[#10294b]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#10294b] truncate" title={doc.file_name}>
                            {doc.file_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-[#78716C]">{formatFileSize(doc.file_size)}</span>
                            {doc.task_name && (
                              <>
                                <span className="text-[#E7E5E4]">•</span>
                                <span className="text-xs text-[#78716C] truncate">{doc.task_name}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-[#78716C] mt-1">{formatDate(doc.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={doc.google_drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[#78716C] hover:text-[#10294b] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                            title="View document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            download
                            className="p-2 text-[#78716C] hover:text-[#10294b] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Card */}
            <div className="mt-6 bg-gradient-to-br from-[#10294b] to-[#152a45] rounded-xl p-6 text-white">
              <div className="w-12 h-12 rounded-full bg-[#C9A962]/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-[#C9A962]" />
              </div>
              <h3 className="font-serif text-lg mb-2">{t("dashboard.needAssistance")}</h3>
              <p className="text-sm text-white/70 mb-4">
                {t("dashboard.assistanceDescription")}
              </p>
              <a
                href="mailto:info@conecta-re.com"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#C9A962] hover:text-white transition-colors"
              >
                {t("dashboard.contactSupport")}
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E4] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#10294b]" />
              <span className="text-sm text-[#78716C]">© 2025 Conecta. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#78716C]">
              <Link href="/portal/privacy" className="hover:text-[#10294b] transition-colors">
                Privacy
              </Link>
              <Link href="/portal/terms" className="hover:text-[#10294b] transition-colors">
                Terms
              </Link>
              <Link href="/portal/settings" className="hover:text-[#10294b] transition-colors">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
