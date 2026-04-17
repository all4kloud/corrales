"use client"

import { TemplateForm } from "@/components/templates/template-form"

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Follow-up Template</h1>
        <p className="text-muted-foreground">
          Create a new template that will automatically generate follow-up tasks for transactions
        </p>
      </div>

      <TemplateForm />
    </div>
  )
}
