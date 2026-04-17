import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LendersList } from "@/components/entities/lenders-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function LendersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lenders</h1>
            <p className="text-muted-foreground">Manage mortgage lenders and financial institutions</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/lenders/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Lender
            </Link>
          </Button>
        </div>

        <LendersList />
      </div>
    </DashboardLayout>
  )
}
