import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpsList } from "@/components/follow-ups/follow-ups-list"
import { FollowUpFilters } from "@/components/follow-ups/follow-up-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function FollowUpsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Follow-ups</h1>
          <Button asChild>
            <Link href="/dashboard/follow-ups/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Link>
          </Button>
        </div>

        <FollowUpFilters />
        <FollowUpsList />
      </div>
    </DashboardLayout>
  )
}
