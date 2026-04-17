import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TitleCompaniesList } from "@/components/entities/title-companies-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function TitleCompaniesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Title Companies</h1>
          <Button asChild>
            <Link href="/dashboard/entities/title-companies/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Title Company
            </Link>
          </Button>
        </div>

        <TitleCompaniesList />
      </div>
    </DashboardLayout>
  )
}
