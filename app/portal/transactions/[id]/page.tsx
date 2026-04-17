"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Building2,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  File,
} from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface TransactionDetails {
  id: string
  property_address: string
  property_city: string
  property_state: string
  property_zip: string
  transaction_type: string
  status: string
  purchase_price: number
  closing_date: string
  contract_date: string
  due_diligence_date: string
  closing_costs: number
  earnest_money_deposit: number
  due_diligence_fee: number
  notes: string
  role: "buyer" | "seller"
  listing_agent?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  selling_agent?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  lender?: {
    company_name: string
    contact_name: string
    email?: string
    phone?: string
  }
  attorney?: {
    firm_name: string
    attorney_name: string
    email?: string
    phone?: string
  }
  buyer_agent?: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
}

interface FollowUp {
  id: string
  event_name: string
  due_date: string
  status: string
  priority: string
  description: string
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
  task_name: string | null
}

export default function PortalTransactionDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useTranslations()
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"tasks" | "documents">("tasks")
  const [showTasks, setShowTasks] = useState(true)
  const [showDocuments, setShowDocuments] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchTransaction()
    }
  }, [params.id])

  const fetchTransaction = async () => {
    try {
      const [transactionRes, followUpsRes, documentsRes] = await Promise.all([
        fetch(`/api/portal/transactions/${params.id}`),
        fetch(`/api/portal/follow-ups?transaction_id=${params.id}`),
        fetch(`/api/portal/documents?transactionId=${params.id}`),
      ])

      if (!transactionRes.ok) {
        router.push("/portal/dashboard")
        return
      }

      const transactionData = await transactionRes.json()
      setTransaction(transactionData.transaction)

      if (followUpsRes.ok) {
        const followUpsData = await followUpsRes.json()
        setFollowUps(followUpsData.followUps || [])
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json()
        setDocuments(documentsData.documents || [])
      }
    } catch (error) {
      console.error("Error fetching transaction:", error)
      router.push("/portal/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return "—"
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
      weekday: "long",
      month: "long",
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

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "medium":
        return <Clock className="w-4 h-4 text-amber-500" />
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#78716C] font-medium">Loading transaction...</p>
        </div>
      </div>
    )
  }

  if (!transaction) return null

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/portal/dashboard")}
                className="flex items-center gap-2 text-[#78716C] hover:text-[#1E3A5F] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>
            <Link href="/portal/dashboard" className="flex items-center gap-3">
              <Image src="/conecta-logo.png" alt="Conecta Logo" width={40} height={40} className="object-contain" />
              <span className="text-xl font-serif text-[#10294b]">Conectare</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Hero */}
        <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#152a45] px-8 py-12 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-4 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(transaction.status)}`}
                  >
                    {transaction.status?.replace(/_/g, " ")}
                  </span>
                  <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-white/10 text-white border border-white/20 capitalize">
                    {transaction.role}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif mb-2">{transaction.property_address}</h1>
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-5 h-5" />
                  <span>
                    {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
                  </span>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-sm text-white/60 mb-1">Purchase Price</p>
                <p className="text-4xl font-serif text-[#C9A962]">{formatCurrency(transaction.purchase_price)}</p>
              </div>
            </div>
          </div>

          {/* Key Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E7E5E4]">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm text-[#78716C]">Contract Date</span>
              </div>
              <p className="text-lg font-medium text-[#1C1917]">{formatDate(transaction.contract_date)}</p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm text-[#78716C]">Due Diligence</span>
              </div>
              <p className="text-lg font-medium text-[#1C1917]">{formatDate(transaction.due_diligence_date)}</p>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm text-[#78716C]">Closing Date</span>
              </div>
              <p className="text-lg font-medium text-[#1C1917]">{formatDate(transaction.closing_date)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Financial Details */}
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E7E5E4]">
                <h2 className="text-xl font-serif text-[#1E3A5F]">Financial Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-[#78716C] mb-1">Earnest Money</p>
                    <p className="text-lg font-medium text-[#1C1917]">
                      {formatCurrency(transaction.earnest_money_deposit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#78716C] mb-1">Due Diligence Fee</p>
                    <p className="text-lg font-medium text-[#1C1917]">
                      {formatCurrency(transaction.due_diligence_fee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#78716C] mb-1">Closing Costs</p>
                    <p className="text-lg font-medium text-[#1C1917]">{formatCurrency(transaction.closing_costs)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#78716C] mb-1">Transaction Type</p>
                    <p className="text-lg font-medium text-[#1C1917] capitalize">
                      {transaction.transaction_type?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
              <div className="flex border-b border-[#E7E5E4]">
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === "tasks"
                      ? "text-[#1E3A5F] bg-[#FDFBF7]"
                      : "text-[#78716C] hover:text-[#1E3A5F] hover:bg-[#FDFBF7]"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Tasks</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F]">
                      {followUps.length}
                    </span>
                  </div>
                  {activeTab === "tasks" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === "documents"
                      ? "text-[#1E3A5F] bg-[#FDFBF7]"
                      : "text-[#78716C] hover:text-[#1E3A5F] hover:bg-[#FDFBF7]"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Documents</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F]">
                      {documents.length}
                    </span>
                  </div>
                  {activeTab === "documents" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]" />
                  )}
                </button>
              </div>

              {/* Tasks Tab Content */}
              {activeTab === "tasks" && (
                <div className="divide-y divide-[#E7E5E4] max-h-[500px] overflow-y-auto">
                  {followUps.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <p className="text-[#78716C]">No tasks for this transaction</p>
                    </div>
                  ) : (
                    followUps.map((task) => (
                      <div key={task.id} className="p-4 hover:bg-[#FDFBF7] transition-colors">
                        <div className="flex items-start gap-4">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                          ) : (
                            getPriorityIcon(task.priority)
                          )}
                          <div className="flex-1">
                            <p
                              className={`font-medium ${task.status === "completed" ? "text-[#78716C] line-through" : "text-[#1C1917]"}`}
                            >
                              {task.event_name}
                            </p>
                            {task.description && <p className="text-sm text-[#78716C] mt-1 line-clamp-2">{task.description}</p>}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-[#78716C]">Due: {formatDate(task.due_date)}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Documents Tab Content */}
              {activeTab === "documents" && (
                <div className="divide-y divide-[#E7E5E4] max-h-[500px] overflow-y-auto">
                  {documents.length === 0 ? (
                    <div className="p-8 text-center">
                      <FileText className="w-12 h-12 text-[#78716C] mx-auto mb-3" />
                      <p className="text-[#78716C]">No documents available yet</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-4 hover:bg-[#FDFBF7] transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
                            <File className="w-5 h-5 text-[#1E3A5F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#1C1917] truncate" title={doc.file_name}>
                              {doc.file_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-[#78716C]">{formatFileSize(doc.file_size)}</span>
                              {doc.task_name && (
                                <>
                                  <span className="text-[#E7E5E4]">•</span>
                                  <span className="text-xs text-[#78716C]">{doc.task_name}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-[#78716C] mt-1">
                              {new Date(doc.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={doc.google_drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-[#78716C] hover:text-[#1E3A5F] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                              title="View in Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <a
                              href={`/api/documents/${doc.id}/download`}
                              download
                              className="p-2 text-[#78716C] hover:text-[#1E3A5F] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Contacts */}
          <div className="space-y-6">
            {/* Listing Agent */}
            {transaction.listing_agent && (
              <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#78716C] mb-4">Listing Agent</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1E3A5F] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1917]">
                      {transaction.listing_agent.first_name} {transaction.listing_agent.last_name}
                    </p>
                    <p className="text-sm text-[#78716C]">Real Estate Agent</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selling Agent */}
            {transaction.selling_agent && (
              <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#78716C] mb-4">Selling Agent</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C9A962] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1917]">
                      {transaction.selling_agent.first_name} {transaction.selling_agent.last_name}
                    </p>
                    <p className="text-sm text-[#78716C]">Real Estate Agent</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buyer Agent */}
            {transaction.buyer_agent && (
              <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#78716C] mb-4">Buyer Agent</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C9A962] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1C1917]">
                      {transaction.buyer_agent.first_name} {transaction.buyer_agent.last_name}
                    </p>
                    <p className="text-sm text-[#78716C]">Real Estate Agent</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lender */}
            {transaction.lender && (
              <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#78716C] mb-4">Lender</h3>
                <div>
                  <p className="font-medium text-[#1C1917]">{transaction.lender.company_name}</p>
                  <p className="text-sm text-[#78716C]">{transaction.lender.contact_name}</p>
                </div>
              </div>
            )}

            {/* Attorney */}
            {transaction.attorney && (
              <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#78716C] mb-4">Attorney</h3>
                <div>
                  <p className="font-medium text-[#1C1917]">{transaction.attorney.firm_name}</p>
                  <p className="text-sm text-[#78716C]">{transaction.attorney.attorney_name}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#78716C] mb-4">Notes</h3>
                <p className="text-sm text-[#1C1917] whitespace-pre-wrap">{transaction.notes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
