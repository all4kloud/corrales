"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface InspectionTemplate {
  id: string
  name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export function InspectionTemplatesList() {
  const router = useRouter()
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/inspection-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/inspection-templates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTemplates()
      } else {
        alert("Failed to delete template")
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("An error occurred")
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading templates...</div>
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No inspection email templates found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.is_default && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Subject: {template.subject}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/inspection-templates/${template.id}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!template.is_default && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground line-clamp-3">
              {template.body.replace(/<[^>]*>/g, "").substring(0, 200)}...
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
