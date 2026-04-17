import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LenderForm } from "@/components/entities/lender-form"

export default async function EditLenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <LenderForm lenderId={id} />
    </DashboardLayout>
  )
}
