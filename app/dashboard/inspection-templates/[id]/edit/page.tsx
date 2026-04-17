import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectionTemplateForm } from "@/components/inspections/inspection-template-form"

export default async function EditInspectionTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <InspectionTemplateForm templateId={id} />
    </DashboardLayout>
  )
}
