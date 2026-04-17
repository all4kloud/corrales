"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Info } from "lucide-react"

interface TemplateFormProps {
  templateId?: string
}

const AVAILABLE_VARIABLES = [
  { key: "{{property.address}}", description: "Property street address" },
  { key: "{{property.city}}", description: "Property city" },
  { key: "{{property.state}}", description: "Property state" },
  { key: "{{inspection.type}}", description: "Type of inspection" },
  { key: "{{inspection.date}}", description: "Requested inspection date" },
  { key: "{{agent.name}}", description: "Agent's full name" },
  { key: "{{agent.email}}", description: "Agent's email" },
  { key: "{{agent.phone}}", description: "Agent's phone number" },
  { key: "{{agent.company}}", description: "Agent's company name" },
  { key: "{{transaction.id}}", description: "Transaction reference number" },
  { key: "{{transaction.closingDate}}", description: "Transaction closing date" },
  { key: "{{client.name}}", description: "Client's full name" },
  { key: "{{inspector.company}}", description: "Inspector company name" },
]

export function InspectionTemplateForm({ templateId }: TemplateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!templateId)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    is_default: false,
  })

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/inspection-templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.template.name || "",
          subject: data.template.subject || "",
          body: data.template.body || "",
          is_default: data.template.is_default || false,
        })
      }
    } catch (error) {
      console.error("Error fetching template:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = templateId ? `/api/inspection-templates/${templateId}` : "/api/inspection-templates"
      const method = templateId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/dashboard/inspection-templates")
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to save template")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      alert("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      body: prev.body + " " + variable,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Home Inspection Request"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Inspection Request for {{property.address}}"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_default: checked as boolean })
              }
            />
            <Label htmlFor="is_default" className="cursor-pointer font-normal">
              Set as default template
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on a variable to insert it into your template
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <Badge
                key={variable.key}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => insertVariable(variable.key)}
              >
                {variable.key}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Body *</CardTitle>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              Variables will be replaced with actual data when the email is sent.
              You can use HTML for formatting.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            rows={15}
            placeholder="Dear {{inspector.company}},&#10;&#10;We would like to request a {{inspection.type}} for the property located at {{property.address}}...&#10;&#10;Best regards,&#10;{{agent.name}}"
            required
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {templateId ? "Update Template" : "Create Template"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
