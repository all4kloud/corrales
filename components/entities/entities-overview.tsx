"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Home, UserCheck, Briefcase, Building, Scale, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface EntityCounts {
  clients: number
  properties: number
  agents: number
  lenders: number
  attorneys: number
  otherEntities: number
}

export function EntitiesOverview() {
  const [entityCounts, setEntityCounts] = useState<EntityCounts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEntityCounts = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setEntityCounts(data.entityCounts)
        }
      } catch (error) {
        console.error("Failed to fetch entity counts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntityCounts()
  }, [])

  const entityTypes = entityCounts
    ? [
        {
          title: "Clients",
          description: "Manage buyers and sellers",
          icon: Users,
          count: entityCounts.clients.toString(),
          href: "/dashboard/clients",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        },
        {
          title: "Properties",
          description: "Property listings and details",
          icon: Home,
          count: entityCounts.properties.toString(),
          href: "/dashboard/properties",
          color: "text-green-600",
          bgColor: "bg-green-100",
        },
        {
          title: "Agents",
          description: "Real estate agents and team",
          icon: UserCheck,
          count: entityCounts.agents.toString(),
          href: "/dashboard/agents",
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        },
        {
          title: "Lenders",
          description: "Mortgage lenders and contacts",
          icon: Building,
          count: entityCounts.lenders.toString(),
          href: "/dashboard/lenders",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        },
        {
          title: "Attorneys",
          description: "Legal professionals and firms",
          icon: Scale,
          count: entityCounts.attorneys.toString(),
          href: "/dashboard/attorneys",
          color: "text-red-600",
          bgColor: "bg-red-100",
        },
        {
          title: "Other Entities",
          description: "Inspectors, contractors, etc.",
          icon: Briefcase,
          count: (entityCounts.otherEntities || 0).toString(),
          href: "/dashboard/other-entities",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        },
      ]
    : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-200 animate-pulse w-9 h-9" />
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="h-8 bg-gray-200 rounded w-8 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
                    <div className="h-8 bg-gray-200 rounded w-8 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entityTypes.map((entity) => (
          <Card key={entity.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${entity.bgColor}`}>
                  <entity.icon className={`h-5 w-5 ${entity.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{entity.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{entity.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{entity.count}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={entity.href}>View All</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`${entity.href}/new`}>
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/clients/new">
                <Users className="h-6 w-6" />
                Add Client
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/properties/new">
                <Home className="h-6 w-6" />
                Add Property
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/agents/new">
                <UserCheck className="h-6 w-6" />
                Add Agent
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/dashboard/transactions/new">
                <Briefcase className="h-6 w-6" />
                New Transaction
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
