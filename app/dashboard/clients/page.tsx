import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ClientsList } from "@/components/entities/clients-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <Button asChild>
            <Link href="/dashboard/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>

        <ClientsList />
      </div>
    </DashboardLayout>
  )
}
