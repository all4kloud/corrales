"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

interface Template {
  id: number
  transaction_type: string
  event_name: string
  description: string
  days_from_contract: number
  priority: string
  is_active: boolean
  created_at: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTemplate = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      })
      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error("Error toggling template:", error)
    }
  }

  const deleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error("Error deleting template:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-green-100 text-green-800"
      case "sale":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading templates...</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Follow-up Templates</h1>
            <p className="text-muted-foreground">
              Manage follow-up event templates that are automatically created for new transactions
            </p>
          </div>
          <Link href="/dashboard/templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className={!template.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.event_name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTransactionTypeColor(template.transaction_type)}>
                      {template.transaction_type}
                    </Badge>
                    <Badge className={getPriorityColor(template.priority)}>{template.priority}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Due {template.days_from_contract} days after contract date
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleTemplate(template.id, template.is_active)}>
                      {template.is_active ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Link href={`/dashboard/templates/${template.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No templates found</p>
              <Link href="/dashboard/templates/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
