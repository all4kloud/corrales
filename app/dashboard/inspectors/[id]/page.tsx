import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectorDetail } from "@/components/entities/inspector-detail"

export default async function InspectorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <InspectorDetail inspectorId={id} />
    </DashboardLayout>
  )
}
