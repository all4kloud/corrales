"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, FileText, Calendar, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DashboardStats {
  activeTransactions: { value: number; change: string; trend: string }
  totalVolume: { value: number; change: string; trend: string }
  pendingTasks: { value: number; change: string; trend: string }
  urgentItems: { value: number; change: string; trend: string }
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = stats
    ? [
        {
          title: "Active Transactions",
          value: stats.activeTransactions.value.toString(),
          change: stats.activeTransactions.change,
          trend: stats.activeTransactions.trend,
          icon: FileText,
          color: "text-blue-600",
        },
        {
          title: "Total Volume",
          value: `$${(stats.totalVolume.value / 1000000).toFixed(1)}M`,
          change: stats.totalVolume.change,
          trend: stats.totalVolume.trend,
          icon: DollarSign,
          color: "text-green-600",
        },
        {
          title: "Pending Tasks",
          value: stats.pendingTasks.value.toString(),
          change: stats.pendingTasks.change,
          trend: stats.pendingTasks.trend,
          icon: Calendar,
          color: "text-orange-600",
        },
        {
          title: "Urgent Items",
          value: stats.urgentItems.value.toString(),
          change: stats.urgentItems.change,
          trend: stats.urgentItems.trend,
          icon: AlertTriangle,
          color: "text-red-600",
        },
      ]
    : []

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => (
        <Link
          key={stat.title}
          href={`/dashboard/reports/${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
          className="block transition-transform hover:scale-105"
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="text-xs">
                  {stat.change}
                </Badge>
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
