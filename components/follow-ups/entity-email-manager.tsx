"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Send, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react"

export type EntityType = "lender" | "attorney" | "other_entity" | "insurance"

interface Entity {
  id: string
  name: string
  contact_name?: string
  email: string
  phone?: string
}

interface EmailRequest {
  id: string
  entity_name: string
  to_email: string
  subject: string
  sent_at: string
  sent_by_name: string
}

interface EntityEmailManagerProps {
  followUpEventId: string
  transactionId: string
  entityType: EntityType
  defaultSubject?: string
  defaultBody?: string
}

const ENTITY_LABELS: Record<EntityType, string> = {
  lender:       "Lender",
  attorney:     "Attorney",
  other_entity: "Entity",
  insurance:    "Insurance Agent",
}

export function EntityEmailManager({
  followUpEventId,
  transactionId,
  entityType,
  defaultSubject = "",
  defaultBody = "",
}: EntityEmailManagerProps) {
  const [entities, setEntities]           = useState<Entity[]>([])
  const [selected, setSelected]           = useState<Record<string, boolean>>({})
  const [subject, setSubject]             = useState(defaultSubject)
  const [body, setBody]                   = useState(defaultBody)
  const [sending, setSending]             = useState(false)
  const [history, setHistory]             = useState<EmailRequest[]>([])
  const [historyOpen, setHistoryOpen]     = useState(false)
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [successCount, setSuccessCount]   = useState<number | null>(null)

  const label = ENTITY_LABELS[entityType]

  const fetchEntities = useCallback(async () => {
    setLoadingEntities(true)
    try {
      const params = new URLSearchParams({ type: entityType, transaction_id: transactionId })
      const res = await fetch(`/api/entity-email-requests/entities?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEntities(data.entities || [])
      }
    } catch (e) {
      console.error("Error fetching entities:", e)
    } finally {
      setLoadingEntities(false)
    }
  }, [entityType, transactionId])

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({ follow_up_event_id: followUpEventId })
      const res = await fetch(`/api/entity-email-requests?${params}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.requests || [])
      }
    } catch (e) {
      console.error("Error fetching email history:", e)
    }
  }, [followUpEventId])

  useEffect(() => {
    fetchEntities()
    fetchHistory()
  }, [fetchEntities, fetchHistory])

  const toggleEntity = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedEntities = entities.filter((e) => selected[e.id])

  const handleSend = async () => {
    if (selectedEntities.length === 0 || !subject.trim() || !body.trim()) return
    setSending(true)
    setError(null)
    setSuccessCount(null)

    try {
      const res = await fetch("/api/entity-email-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follow_up_event_id: followUpEventId,
          transaction_id: transactionId,
          entity_type: entityType,
          entity_ids: selectedEntities.map((e) => ({
            id: e.id,
            name: e.name,
            email: e.email,
            contact_name: e.contact_name,
          })),
          subject,
          email_body: body,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const sent = (data.results || []).filter((r: any) => r.email_sent).length
        setSuccessCount(sent)
        // Reset selection after send
        setSelected({})
        fetchHistory()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to send emails")
      }
    } catch (e) {
      setError("Unexpected error sending emails")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Entity selector */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Select {label}(s) to email
        </Label>

        {loadingEntities ? (
          <p className="text-sm text-muted-foreground py-2">Loading {label.toLowerCase()}s…</p>
        ) : entities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No {label.toLowerCase()}s with email address linked to this transaction.
          </p>
        ) : (
          <div className="space-y-2">
            {entities.map((entity) => (
              <label
                key={entity.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={!!selected[entity.id]}
                  onCheckedChange={() => toggleEntity(entity.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{entity.name}</p>
                  {entity.contact_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{entity.contact_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{entity.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Email compose form */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here…"
            rows={7}
            className="text-sm resize-none"
          />
        </div>
      </div>

      {/* Feedback messages */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {successCount !== null && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>
            {successCount === 0
              ? "No emails were sent."
              : `Email sent to ${successCount} ${label.toLowerCase()}${successCount > 1 ? "s" : ""} successfully.`}
          </span>
        </div>
      )}

      {/* Send button */}
      <Button
        onClick={handleSend}
        disabled={sending || selectedEntities.length === 0 || !subject.trim() || !body.trim()}
        className="gap-2"
      >
        {sending ? (
          <>
            <Send className="h-4 w-4 animate-pulse" />
            Sending…
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Send to {selectedEntities.length > 0 ? `${selectedEntities.length} ${label}${selectedEntities.length > 1 ? "s" : ""}` : `${label}(s)`}
          </>
        )}
      </Button>

      {/* Email history */}
      {history.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Clock className="h-4 w-4" />
              Email history ({history.length})
              {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {historyOpen && (
              <div className="space-y-2">
                {history.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{req.entity_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.to_email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.subject}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">Sent</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {req.sent_by_name} · {new Date(req.sent_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
