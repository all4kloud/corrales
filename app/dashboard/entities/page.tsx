import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { EntitiesOverview } from "@/components/entities/entities-overview"

export default function EntitiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Entities</h1>
        </div>

        <EntitiesOverview />
      </div>
    </DashboardLayout>
  )
}
