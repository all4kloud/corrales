import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewInsuranceAgentPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/entities/insurance-agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add New Insurance Agent</h1>
            <p className="text-muted-foreground">Create a new insurance agent profile</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Insurance Agent Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Robert Johnson" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <Input id="company" placeholder="ABC Insurance Agency" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="robert@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" placeholder="(555) 123-4567" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input id="license" placeholder="INS-12345" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverage">Coverage Types</Label>
                <Textarea id="coverage" placeholder="e.g., Homeowners, Title, Flood, Liability" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Additional information about this insurance agent" />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/entities/insurance-agents">Cancel</Link>
                </Button>
                <Button type="submit">Save Insurance Agent</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
