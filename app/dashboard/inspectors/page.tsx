import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectorsList } from "@/components/entities/inspectors-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function InspectorsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inspectors</h1>
            <p className="text-muted-foreground">Manage inspection service providers</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/inspectors/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Inspector
            </Link>
          </Button>
        </div>

        <InspectorsList />
      </div>
    </DashboardLayout>
  )
}
