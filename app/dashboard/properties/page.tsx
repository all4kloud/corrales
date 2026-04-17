import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PropertiesList } from "@/components/entities/properties-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function PropertiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Properties</h1>
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>

        <PropertiesList />
      </div>
    </DashboardLayout>
  )
}
