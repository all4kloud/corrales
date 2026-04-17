import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpCalendar } from "@/components/follow-ups/follow-up-calendar"
import { Button } from "@/components/ui/button"
import { Calendar, List } from "lucide-react"
import Link from "next/link"

export default function FollowUpCalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Follow-up Calendar</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/follow-ups">
                <List className="h-4 w-4 mr-2" />
                List View
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/follow-ups/new">
                <Calendar className="h-4 w-4 mr-2" />
                Add Follow-up
              </Link>
            </Button>
          </div>
        </div>

        <FollowUpCalendar />
      </div>
    </DashboardLayout>
  )
}
