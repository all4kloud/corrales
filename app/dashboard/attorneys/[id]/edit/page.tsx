import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AttorneyForm } from "@/components/entities/attorney-form"

interface EditAttorneyPageProps {
  params: {
    id: string
  }
}

export default function EditAttorneyPage({ params }: EditAttorneyPageProps) {
  return (
    <DashboardLayout>
      <AttorneyForm attorneyId={params.id} />
    </DashboardLayout>
  )
}
