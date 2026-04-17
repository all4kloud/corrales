import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AttorneysList } from "@/components/entities/attorneys-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AttorneysPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attorneys</h1>
            <p className="text-muted-foreground">Manage legal professionals and law firms</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/attorneys/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Attorney
            </Link>
          </Button>
        </div>

        <AttorneysList />
      </div>
    </DashboardLayout>
  )
}
