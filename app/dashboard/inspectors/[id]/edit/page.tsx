import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectorForm } from "@/components/entities/inspector-form"

export default async function EditInspectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <InspectorForm inspectorId={id} />
    </DashboardLayout>
  )
}
