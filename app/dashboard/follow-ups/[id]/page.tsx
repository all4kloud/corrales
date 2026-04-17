import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpDetails } from "@/components/follow-ups/follow-up-details"

export default async function FollowUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <FollowUpDetails followUpId={id} />
    </DashboardLayout>
  )
}
