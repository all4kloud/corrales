import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ClientDetails } from "@/components/clients/client-details"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <ClientDetails clientId={id} />
    </DashboardLayout>
  )
}
