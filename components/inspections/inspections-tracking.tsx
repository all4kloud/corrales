"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface InspectionRequest {
  id: string
  transaction_id: string
  follow_up_event_id: string | null
  inspection_type_name: string
  inspector_company: string
  inspector_contact: string
  inspector_email: string
  inspector_phone: string | null
  status: string
  requested_date: string | null
  email_sent_at: string | null
  created_at: string
  sent_by_name: string | null
  property_address: string
  follow_up_event_name: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200",  icon: <Clock className="h-3 w-3" /> },
  sent:     { label: "Sent",     color: "bg-blue-50 text-blue-700 border-blue-200",     icon: <Mail className="h-3 w-3" /> },
  confirmed:{ label: "Confirmed",color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  completed:{ label: "Completed",color: "bg-slate-50 text-slate-700 border-slate-200",  icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled:{ label: "Cancelled",color: "bg-red-50 text-red-700 border-red-200",        icon: <XCircle className="h-3 w-3" /> },
}

export function InspectionsTracking() {
  const [requests, setRequests] = useState<InspectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/inspection-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Error fetching inspection requests:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const filtered = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.inspector_company.toLowerCase().includes(search.toLowerCase()) ||
      r.inspector_contact.toLowerCase().includes(search.toLowerCase()) ||
      r.property_address?.toLowerCase().includes(search.toLowerCase()) ||
      r.inspection_type_name.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesType   = typeFilter === "all"   || r.inspection_type_name === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const uniqueTypes = [...new Set(requests.map((r) => r.inspection_type_name))].sort()

  const stats = {
    total:    requests.length,
    pending:  requests.filter((r) => r.status === "pending").length,
    sent:     requests.filter((r) => r.status === "sent").length,
    confirmed:requests.filter((r) => r.status === "confirmed").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inspections</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all inspection requests across transactions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total,     color: "text-foreground" },
          { label: "Pending", value: stats.pending,   color: "text-amber-600" },
          { label: "Sent",    value: stats.sent,      color: "text-blue-600" },
          { label: "Confirmed", value: stats.confirmed, color: "text-emerald-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inspector, property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Inspection Requests
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">No inspection requests found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((request) => {
                const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending
                return (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40 transition-colors">
                    {/* Left — inspector + property */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{request.inspector_company}</span>
                        <Badge variant="outline" className="text-xs">{request.inspection_type_name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.inspector_contact}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {request.inspector_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.inspector_email}
                          </span>
                        )}
                        {request.inspector_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.inspector_phone}
                          </span>
                        )}
                      </div>
                      {request.property_address && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {request.property_address}
                        </div>
                      )}
                      {request.follow_up_event_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          Task: {request.follow_up_event_name}
                        </div>
                      )}
                    </div>

                    {/* Right — status + dates + link */}
                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {request.email_sent_at && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          Sent {new Date(request.email_sent_at).toLocaleDateString()}
                        </span>
                      )}
                      {request.requested_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Requested {new Date(request.requested_date).toLocaleDateString()}
                        </span>
                      )}
                      {request.sent_by_name && (
                        <span className="text-xs text-muted-foreground">By {request.sent_by_name}</span>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Link href={`/dashboard/transactions/${request.transaction_id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Transaction
                          </Button>
                        </Link>
                        {request.follow_up_event_id && (
                          <Link href={`/dashboard/follow-ups/${request.follow_up_event_id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Task
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
