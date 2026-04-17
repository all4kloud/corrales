"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, CheckCircle, X, Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AlertItem {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  action: string
}

export function AlertsPanel() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const [overdueResponse, closingSoonResponse] = await Promise.all([
          fetch("/api/follow-ups?status=overdue&limit=3"),
          fetch("/api/transactions?status=pending&closing_soon=true&limit=3"),
        ])

        const generatedAlerts: AlertItem[] = []

        // Add overdue task alerts
        if (overdueResponse.ok) {
          const overdueData = await overdueResponse.json()
          overdueData.followUps?.forEach((task: any) => {
            const propertyInfo = task.property_address
              ? `${task.property_address}, ${task.property_city || ""} ${task.property_state || ""}`.trim()
              : "Unknown property"

            generatedAlerts.push({
              id: `overdue-${task.id}`,
              type: "urgent",
              title: "Overdue Task",
              message: `${task.event_name} is overdue for ${propertyInfo}`,
              timestamp: "Now",
              action: "Complete Task",
            })
          })
        }

        // Add closing soon alerts for active transactions
        if (closingSoonResponse.ok) {
          const closingSoonData = await closingSoonResponse.json()
          closingSoonData.transactions?.forEach((transaction: any) => {
            const propertyInfo = transaction.property_address
              ? `${transaction.property_address}, ${transaction.property_city || ""} ${transaction.property_state || ""}`.trim()
              : "Unknown property"

            generatedAlerts.push({
              id: `closing-${transaction.id}`,
              type: "warning",
              title: "Closing Date Approaching",
              message: `Transaction for ${propertyInfo} closes soon`,
              timestamp: "2 hours ago",
              action: "Review Transaction",
            })
          })
        }

        // Add a sample info alert if no other alerts
        if (generatedAlerts.length === 0) {
          generatedAlerts.push({
            id: "info-sample",
            type: "info",
            title: "All Clear",
            message: "No urgent items or overdue tasks at this time",
            timestamp: "Just now",
            action: "View Dashboard",
          })
        }

        setAlerts(generatedAlerts.slice(0, 3))
      } catch (error) {
        console.error("Failed to fetch alerts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-orange-200 bg-orange-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      case "success":
        return "border-green-200 bg-green-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId))
  }

  const handleAlertAction = (alertId: string, action: string) => {
    if (alertId.startsWith("overdue-")) {
      const taskId = alertId.replace("overdue-", "")
      router.push(`/dashboard/follow-ups/${taskId}`)
    } else if (alertId.startsWith("closing-")) {
      const transactionId = alertId.replace("closing-", "")
      router.push(`/dashboard/transactions/${transactionId}`)
    }
    handleDismissAlert(alertId)
  }

  const handleEditAlert = (alertId: string) => {
    if (alertId.startsWith("overdue-")) {
      const taskId = alertId.replace("overdue-", "")
      router.push(`/dashboard/follow-ups/${taskId}`)
    } else if (alertId.startsWith("closing-")) {
      const transactionId = alertId.replace("closing-", "")
      router.push(`/dashboard/transactions/${transactionId}`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alerts</CardTitle>
          <Badge variant="secondary">...</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Alert key={i} className="border-gray-200 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alerts</CardTitle>
        <Badge variant="secondary">{alerts.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={getAlertColor(alert.type)}>
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <AlertDescription className="text-xs">{alert.message}</AlertDescription>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditAlert(alert.id)}
                        title="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => handleAlertAction(alert.id, alert.action)}
                      >
                        {alert.action}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDismissAlert(alert.id)}
                        title="Dismiss alert"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
          {alerts.length === 0 && <div className="text-center py-8 text-muted-foreground">No alerts at this time</div>}
        </div>
      </CardContent>
    </Card>
  )
}
