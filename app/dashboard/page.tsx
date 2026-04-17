"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { EntitiesOverview } from "@/components/entities/entities-overview"
import { GeneralTasks } from "@/components/dashboard/general-tasks"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    timeRange: "all",
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      priority: "all",
      timeRange: "all",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <Button asChild>
            <Link href="/dashboard/transactions/new">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Link>
          </Button>
        </div>

        <DashboardFilters filters={filters} onFilterChange={handleFilterChange} onClearFilters={clearFilters} />

        <DashboardOverview />

        {/* General Tasks Section */}
        <GeneralTasks />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentTransactions filters={filters} />
          </div>
          <div className="space-y-6">
            <AlertsPanel />
            <UpcomingTasks />
          </div>
        </div>

        {/* Entities Overview Section */}
        <EntitiesOverview />
      </div>
    </DashboardLayout>
  )
}
