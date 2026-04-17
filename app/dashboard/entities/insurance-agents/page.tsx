import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase } from "lucide-react"
import Link from "next/link"

export default function InsuranceAgentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Insurance Agents</h1>
              <p className="text-muted-foreground">Track insurance providers and policies</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/entities/insurance-agents/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Insurance Agent
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Insurance Agent List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No insurance agents found. Add your first insurance agent to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
