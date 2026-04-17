import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AgentsList } from "@/components/entities/agents-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AgentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Agents</h1>
          <Button asChild>
            <Link href="/dashboard/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Link>
          </Button>
        </div>

        <AgentsList />
      </div>
    </DashboardLayout>
  )
}
