"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, Eye, X, CheckCircle2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Inspector {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  specialties: string[]
}

interface InspectionTemplate {
  id: string
  name: string
  subject: string
  body: string
}

interface InspectionRequest {
  id: string
  inspector_id: string
  inspector_name: string
  inspector_email: string
  status: string
  sent_at: string
}

interface InspectionRequestManagerProps {
  followUpId: string
  transactionId: string
  inspectionType: string
  inspectionTypeId: string
  isInspectionRelated: boolean
}

export function InspectionRequestManager({
  followUpId,
  transactionId,
  inspectionType,
  inspectionTypeId,
  isInspectionRelated,
}: InspectionRequestManagerProps) {
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [requests, setRequests] = useState<InspectionRequest[]>([])
  const [selectedInspectors, setSelectedInspectors] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (isInspectionRelated) {
      fetchInspectors()
      fetchTemplates()
      fetchRequests()
    }
  }, [isInspectionRelated, followUpId])

  const fetchInspectors = async () => {
    try {
      const response = await fetch(`/api/inspectors?inspection_type=${inspectionType}`)
      if (response.ok) {
        const data = await response.json()
        setInspectors(data.inspectors || [])
      }
    } catch (error) {
      console.error("Error fetching inspectors:", error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/inspection-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        // Set default template if available
        const defaultTemplate = data.templates?.find((t: InspectionTemplate) => t.is_default)
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id)
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/inspection-requests?follow_up_id=${followUpId}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
    }
  }

  const handlePreview = async () => {
    if (!selectedTemplate) {
      setMessage({ type: "error", text: "Please select a template" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/inspection-requests/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplate,
          transaction_id: transactionId,
          inspection_type: inspectionType,
          // Pass first selected inspector so preview shows their name
          inspector_id: selectedInspectors[0] || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewHtml(data.html)
      } else {
        setMessage({ type: "error", text: "Failed to generate preview" })
      }
    } catch (error) {
      console.error("Error generating preview:", error)
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequests = async () => {
    if (selectedInspectors.length === 0) {
      setMessage({ type: "error", text: "Please select at least one inspector" })
      return
    }

    if (!selectedTemplate) {
      setMessage({ type: "error", text: "Please select a template" })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const response = await fetch("/api/inspection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follow_up_event_id: followUpId,
          transaction_id: transactionId,
          inspector_ids: selectedInspectors,
          inspection_type_id: inspectionTypeId,
          template_id: selectedTemplate,
          inspection_type: inspectionType,
        }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Inspection requests sent successfully" })
        setSelectedInspectors([])
        fetchRequests()
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error || "Failed to send requests" })
      }
    } catch (error) {
      console.error("Error sending requests:", error)
      setMessage({ type: "error", text: "An error occurred" })
    } finally {
      setSending(false)
    }
  }

  const toggleInspector = (inspectorId: string) => {
    setSelectedInspectors((prev) =>
      prev.includes(inspectorId) ? prev.filter((id) => id !== inspectorId) : [...prev, inspectorId]
    )
  }

  if (!isInspectionRelated) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Inspection Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Previous Requests */}
        {requests.length > 0 && (
          <div>
            <Label className="mb-2 block">Previous Requests</Label>
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.inspector_name}</p>
                    <p className="text-sm text-muted-foreground">{request.inspector_email}</p>
                    <p className="text-xs text-muted-foreground">
                      Sent: {new Date(request.sent_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={request.status === "sent" ? "secondary" : "default"}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspector Selection */}
        <div>
          <Label className="mb-2 block">Select Inspectors</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {inspectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inspectors found for {inspectionType}</p>
            ) : (
              inspectors.map((inspector) => (
                <label
                  key={inspector.id}
                  className="flex items-start gap-3 p-2 hover:bg-accent rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedInspectors.includes(inspector.id)}
                    onChange={() => toggleInspector(inspector.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{inspector.company_name}</p>
                    <p className="text-sm text-muted-foreground">{inspector.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{inspector.email}</p>
                    {inspector.phone && (
                      <p className="text-sm text-muted-foreground">{inspector.phone}</p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <Label htmlFor="template">Email Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handlePreview} disabled={loading || !selectedTemplate}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Email Preview</DialogTitle>
              </DialogHeader>
              {previewHtml ? (
                <div
                  className="border rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-muted-foreground">Click "Preview Email" to see the email content</p>
              )}
            </DialogContent>
          </Dialog>

          <Button onClick={handleSendRequests} disabled={sending || selectedInspectors.length === 0}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : `Send Request${selectedInspectors.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
