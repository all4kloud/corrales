import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InspectionTemplatesList } from "@/components/inspections/inspection-templates-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function InspectionTemplatesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inspection Email Templates</h1>
            <p className="text-muted-foreground">Manage email templates for inspection requests</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/inspection-templates/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Link>
          </Button>
        </div>

        <InspectionTemplatesList />
      </div>
    </DashboardLayout>
  )
}
