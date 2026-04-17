"use client"

import { useEffect, useState, useCallback } from "react"
import { Mail, ChevronDown, ChevronUp } from "lucide-react"

interface EmailLog {
  id: string
  to_email: string
  to_name: string | null
  cc_emails: string[] | null
  subject: string
  body: string
  party_type: string | null
  sent_at: string
  sent_by_first_name: string | null
  sent_by_last_name: string | null
}

interface PartyEmailLogProps {
  transactionId: string
  refreshTrigger?: number
}

export function PartyEmailLog({ transactionId, refreshTrigger = 0 }: PartyEmailLogProps) {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/email-logs`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs, refreshTrigger])

  if (loading) return null
  if (logs.length === 0) return null

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("es-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Historial de correos ({logs.length})
        </h4>
      </div>

      <div className="space-y-2">
        {logs.map((log) => {
          const isExpanded = expanded === log.id
          const sentBy = log.sent_by_first_name
            ? `${log.sent_by_first_name} ${log.sent_by_last_name}`
            : "Sistema"

          return (
            <div key={log.id} className="rounded-md border bg-muted/30 text-sm overflow-hidden">
              {/* Header row */}
              <button
                type="button"
                className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : log.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.party_type && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {log.party_type}
                      </span>
                    )}
                    <span className="font-medium truncate">{log.subject}</span>
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5 flex flex-wrap gap-x-3">
                    <span>
                      Para: <span className="text-foreground">{log.to_name || log.to_email}</span>
                    </span>
                    <span>
                      Por: <span className="text-foreground">{sentBy}</span>
                    </span>
                    <span>{formatDate(log.sent_at)}</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t bg-background/50">
                  {log.cc_emails && log.cc_emails.length > 0 && (
                    <p className="text-xs text-muted-foreground pt-2">
                      CC: {log.cc_emails.join(", ")}
                    </p>
                  )}
                  <pre className="whitespace-pre-wrap font-sans text-xs text-foreground pt-2 leading-relaxed">
                    {log.body}
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
