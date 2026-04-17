"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Edit,
  ArrowLeft,
  Calendar,
  User,
  Home,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Save,
  X,
  Paperclip,
  Download,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { InspectionRequestManager } from "@/components/follow-ups/inspection-request-manager"
import { EntityEmailManager, type EntityType } from "@/components/follow-ups/entity-email-manager"

interface FollowUpDetail {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "completed" | "cancelled" | "overdue"
  assigned_to: string
  assigned_first_name: string
  assigned_last_name: string
  transaction_id: string
  transaction_type: string
  property_address: string
  property_city: string
  property_state: string
  property_zip: string
  buyer_first_name: string
  buyer_last_name: string
  buyer_email: string
  buyer_phone: string
  seller_first_name: string
  seller_last_name: string
  seller_email: string
  seller_phone: string
  notes: string
  created_at: string
  updated_at: string
  is_inspection_related: boolean
  inspection_type_name: string | null
  inspection_type_id: string | null
  template_id: string | null
  related_entity_type: EntityType | null
}

interface Attachment {
  id: string
  name: string
  created_at: string
  google_drive_url?: string
}

export function FollowUpDetails({ followUpId }: { followUpId: string }) {
  const [followUp, setFollowUp] = useState<FollowUpDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchFollowUp()
    fetchAttachments()
  }, [followUpId])

  const fetchFollowUp = async () => {
    try {
  const response = await fetch(`/api/follow-ups/${followUpId}`)
  if (response.ok) {
    const data = await response.json()
    setFollowUp(data.followUp)
    setNotesValue(data.followUp.notes || "")
      } else {
        router.push("/dashboard/follow-ups")
      }
    } catch (error) {
      console.error("Error fetching follow-up:", error)
      router.push("/dashboard/follow-ups")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}/attachments`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error("Error fetching attachments:", error)
    }
  }

  const handleSaveNotes = async () => {
    if (!followUp) return
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      })

      if (response.ok) {
        setFollowUp({ ...followUp, notes: notesValue })
        setIsEditingNotes(false)
      }
    } catch (error) {
      console.error("Error saving notes:", error)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("followUpId", followUpId)

    try {
      const response = await fetch(`/api/follow-ups/${followUpId}/attachments`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await fetchAttachments()
      }
    } catch (error) {
      console.error("Error uploading file:", error)
    } finally {
      setUploadingFile(false)
      e.target.value = ""
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId))
      }
    } catch (error) {
      console.error("Error deleting attachment:", error)
    }
  }

  const handleComplete = async () => {
    if (!followUp) return

    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setFollowUp({ ...followUp, status: "completed" })
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (priority: string, status: string) => {
    if (status === "overdue") return <AlertTriangle className="h-5 w-5 text-red-500" />
    if (status === "completed") return <CheckCircle className="h-5 w-5 text-green-500" />
    if (priority === "urgent" || priority === "high") return <Clock className="h-5 w-5 text-orange-500" />
    return <Clock className="h-5 w-5 text-blue-500" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    if (diffDays === 0) return `${formattedDate} (Today)`
    if (diffDays === 1) return `${formattedDate} (Tomorrow)`
    if (diffDays === -1) return `${formattedDate} (Yesterday)`
    if (diffDays < 0) return `${formattedDate} (${Math.abs(diffDays)} days overdue)`
    if (diffDays > 0) return `${formattedDate} (${diffDays} days left)`

    return formattedDate
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading follow-up details...</div>
      </div>
    )
  }

  if (!followUp) {
    return (
      <div className="space-y-6">
        <div className="text-center">Follow-up not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/follow-ups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {getStatusIcon(followUp.priority, followUp.status)}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{followUp.event_name}</h1>
              <p className="text-muted-foreground">
                {followUp.property_address}, {followUp.property_city}, {followUp.property_state}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {followUp.status === "pending" && (
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          <Button asChild>
            <Link href={`/dashboard/follow-ups/${followUp.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Follow-up
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Follow-up Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Follow-up Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(followUp.status)}>{followUp.status}</Badge>
                <Badge className={getPriorityColor(followUp.priority)}>{followUp.priority}</Badge>
                <Badge variant="outline">{followUp.transaction_type}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-semibold">{formatDate(followUp.due_date)}</p>
                  </div>
                </div>
              </div>

              {followUp.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{followUp.description}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  {!isEditingNotes && followUp.status !== "completed" && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add notes about this follow-up task..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
                        <Save className="h-3 w-3 mr-1" />
                        {savingNotes ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingNotes(false)
                          setNotesValue(followUp.notes || "")
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm bg-muted p-3 rounded-lg">{followUp.notes || "No notes added yet"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inspection Request Manager — shown only when task is inspection-related */}
          {followUp.is_inspection_related && followUp.transaction_id && (
            <InspectionRequestManager
              followUpId={followUp.id}
              transactionId={followUp.transaction_id}
              inspectionType={followUp.inspection_type_name || ""}
              inspectionTypeId={followUp.inspection_type_id || ""}
              isInspectionRelated={followUp.is_inspection_related}
            />
          )}

          {/* Entity Email Manager — shown when task has a related entity type */}
          {followUp.related_entity_type && followUp.transaction_id && (() => {
            const entityLabels: Record<string, string> = {
              lender: "Lender",
              attorney: "Attorney",
              other_entity: "Entity",
              insurance: "Insurance Agent",
            }
            const entityLabel = entityLabels[followUp.related_entity_type] ?? followUp.related_entity_type
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Send Email to {entityLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EntityEmailManager
                    followUpEventId={followUp.id}
                    transactionId={followUp.transaction_id}
                    entityType={followUp.related_entity_type as EntityType}
                  />
                </CardContent>
              </Card>
            )
          })()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments
                </div>
                {followUp.status !== "completed" && (
                  <label>
                    <Input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                    <Button size="sm" asChild>
                      <span className="cursor-pointer">
                        <Paperclip className="h-3 w-3 mr-1" />
                        {uploadingFile ? "Uploading..." : "Attach File"}
                      </span>
                    </Button>
                  </label>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No attachments yet</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attachment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {attachment.google_drive_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={attachment.google_drive_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {followUp.status !== "completed" && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteAttachment(attachment.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{followUp.property_address}</p>
                <p className="text-muted-foreground">
                  {followUp.property_city}, {followUp.property_state} {followUp.property_zip}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Type</p>
                  <p className="font-semibold">{followUp.transaction_type}</p>
                </div>
              </div>

              <Button variant="outline" asChild>
                <Link href={`/dashboard/transactions/${followUp.transaction_id}`}>View Full Transaction</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followUp.assigned_first_name ? (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned to</p>
                  <p className="font-semibold">
                    {followUp.assigned_first_name} {followUp.assigned_last_name}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Not assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Parties Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {followUp.buyer_first_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buyer</p>
                  <p className="font-semibold">
                    {followUp.buyer_first_name} {followUp.buyer_last_name}
                  </p>
                  {followUp.buyer_email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{followUp.buyer_email}</span>
                    </div>
                  )}
                  {followUp.buyer_phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{followUp.buyer_phone}</span>
                    </div>
                  )}
                </div>
              )}

              {followUp.seller_first_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Seller</p>
                    <p className="font-semibold">
                      {followUp.seller_first_name} {followUp.seller_last_name}
                    </p>
                    {followUp.seller_email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{followUp.seller_email}</span>
                      </div>
                    )}
                    {followUp.seller_phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{followUp.seller_phone}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">{new Date(followUp.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${followUp.status === "completed" ? "bg-green-500" : "bg-muted"}`}
                ></div>
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(followUp.due_date)}</p>
                </div>
              </div>
              {followUp.status === "completed" && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(followUp.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
