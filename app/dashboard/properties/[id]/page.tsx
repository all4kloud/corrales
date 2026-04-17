import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PropertyDetails } from "@/components/properties/property-details"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <PropertyDetails propertyId={id} />
    </DashboardLayout>
  )
}
