"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Home,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  FileText,
  Ban,
  MinusCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface FollowUp {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "completed" | "cancelled" | "overdue" | "not_applicable"
  assigned_to: string
  assigned_first_name: string
  assigned_last_name: string
  transaction_id: string
  transaction_type: string
  property_address: string
  property_city: string
  property_state: string
  notes: string
  created_at: string
  completed_at?: string
}

export function FollowUpsList() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    fetchFollowUps()
  }, [])

  const fetchFollowUps = async () => {
    try {
      const response = await fetch("/api/follow-ups")
      if (response.ok) {
        const data = await response.json()
        setFollowUps(data.followUps)
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        fetchFollowUps()
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
    }
  }

  const handleNotApplicable = async (id: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "not_applicable",
        }),
      })

      if (response.ok) {
        fetchFollowUps()
      }
    } catch (error) {
      console.error("Error marking follow-up as not applicable:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      case "not_applicable":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityIcon = (priority: string, status: string) => {
    if (status === "overdue") return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === "not_applicable") return <MinusCircle className="h-4 w-4 text-slate-500" />
    if (priority === "urgent" || priority === "high") return <Clock className="h-4 w-4 text-orange-500" />
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays > 0) return `${diffDays} days left`

    return date.toLocaleDateString()
  }

  const getDaysUntilDue = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading follow-ups...</div>
        </CardContent>
      </Card>
    )
  }

  // Group follow-ups by urgency
  const overdueItems = followUps.filter((item) => item.status === "overdue")
  const urgentItems = followUps.filter((item) => item.priority === "urgent" && item.status === "pending")
  const todayItems = followUps.filter((item) => {
    const days = getDaysUntilDue(item.due_date)
    return days === 0 && item.status === "pending" && item.priority !== "urgent"
  })
  const upcomingItems = followUps.filter((item) => {
    const days = getDaysUntilDue(item.due_date)
    return days > 0 && item.status === "pending"
  })
  const completedItems = followUps.filter((item) => item.status === "completed")
  const notApplicableItems = followUps.filter((item) => item.status === "not_applicable")

  const renderFollowUpGroup = (title: string, items: FollowUp[], colorClass: string) => {
    if (items.length === 0) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${colorClass}`}>
            {title} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((followUp) => (
              <div
                key={followUp.id}
                className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedItems.includes(followUp.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedItems([...selectedItems, followUp.id])
                    } else {
                      setSelectedItems(selectedItems.filter((id) => id !== followUp.id))
                    }
                  }}
                />

                {getPriorityIcon(followUp.priority, followUp.status)}

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{followUp.event_name}</h4>
                    <Badge className={getPriorityColor(followUp.priority)}>{followUp.priority}</Badge>
                    <Badge className={getStatusColor(followUp.status)}>{followUp.status}</Badge>
                  </div>

                  {followUp.description && <p className="text-sm text-muted-foreground">{followUp.description}</p>}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>
                        {followUp.property_address}, {followUp.property_city}, {followUp.property_state}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(followUp.due_date)}</span>
                    </div>
                    {followUp.assigned_first_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          {followUp.assigned_first_name} {followUp.assigned_last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {followUp.notes && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{followUp.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(followUp.status === "pending" || followUp.status === "overdue") && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleComplete(followUp.id)} title="Mark as Completed">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleNotApplicable(followUp.id)} title="Mark as Not Applicable">
                        <Ban className="h-4 w-4 text-slate-600" />
                      </Button>
                    </>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/follow-ups/${followUp.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/follow-ups/${followUp.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {renderFollowUpGroup("Overdue", overdueItems, "text-red-600")}
      {renderFollowUpGroup("Urgent", urgentItems, "text-orange-600")}
      {renderFollowUpGroup("Due Today", todayItems, "text-blue-600")}
      {renderFollowUpGroup("Upcoming", upcomingItems, "text-gray-600")}
      {renderFollowUpGroup("Completed", completedItems, "text-green-600")}
      {renderFollowUpGroup("Not Applicable", notApplicableItems, "text-slate-600")}

      {followUps.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No follow-ups found</h3>
            <p className="text-muted-foreground mb-4">
              Follow-ups are automatically created when you add transactions, or you can create them manually.
            </p>
            <Button asChild>
              <Link href="/dashboard/follow-ups/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Follow-up
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
