"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TemplateForm } from "@/components/templates/template-form"

interface Template {
  id: number
  transaction_type: string
  event_name: string
  description: string
  days_from_contract: number
  priority: string
  is_active: boolean
}

export default function EditTemplatePage() {
  const params = useParams()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplate()
  }, [])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      }
    } catch (error) {
      console.error("Error fetching template:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading template...</div>
  }

  if (!template) {
    return <div className="text-center">Template not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Follow-up Template</h1>
        <p className="text-muted-foreground">Update the template settings and configuration</p>
      </div>

      <TemplateForm template={template} />
    </div>
  )
}
