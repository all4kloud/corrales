import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Scale } from "lucide-react"
import Link from "next/link"

export default function AppraisersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Appraisers</h1>
              <p className="text-muted-foreground">Manage property appraisers and valuations</p>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/entities/appraisers/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Appraiser
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appraiser List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No appraisers found. Add your first appraiser to get started.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
