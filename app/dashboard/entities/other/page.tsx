import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Building, Scale, Briefcase } from "lucide-react"
import Link from "next/link"

export default function OtherEntitiesPage() {
  const entityTypes = [
    {
      title: "Title Companies",
      description: "Manage title companies and their services",
      icon: Building,
      count: 0,
      href: "/dashboard/entities/title-companies",
      addHref: "/dashboard/entities/title-companies/new",
    },
    {
      title: "Inspectors",
      description: "Track home inspectors and their reports",
      icon: Users,
      count: 0,
      href: "/dashboard/entities/inspectors",
      addHref: "/dashboard/entities/inspectors/new",
    },
    {
      title: "Appraisers",
      description: "Manage property appraisers and valuations",
      icon: Scale,
      count: 0,
      href: "/dashboard/entities/appraisers",
      addHref: "/dashboard/entities/appraisers/new",
    },
    {
      title: "Insurance Agents",
      description: "Track insurance providers and policies",
      icon: Briefcase,
      count: 0,
      href: "/dashboard/entities/insurance-agents",
      addHref: "/dashboard/entities/insurance-agents/new",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Other Entities</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entityTypes.map((entityType) => {
            const IconComponent = entityType.icon
            return (
              <Card key={entityType.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{entityType.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{entityType.count} entries</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{entityType.description}</p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={entityType.href}>View All</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={entityType.addHref}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add New
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Additional entity types and management features are being developed. Contact support if you need specific
              entity types added to your system.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
