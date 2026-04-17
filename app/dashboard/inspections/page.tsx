"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectionsTracking } from "@/components/inspections/inspections-tracking"

export default function InspectionsPage() {
  return (
    <DashboardLayout>
      <InspectionsTracking />
    </DashboardLayout>
  )
}
