"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle, Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: string
  status: string
  transaction_id: string
}

export function UpcomingTasks() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/follow-ups?status=pending&limit=5&sort=due_date&order=asc")
        if (response.ok) {
          const data = await response.json()
          setTasks(data.followUps || [])
        }
      } catch (error) {
        console.error("Failed to fetch upcoming tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", completed_at: new Date().toISOString() }),
      })

      if (response.ok) {
        setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, status: "completed" } : task)))
      }
    } catch (error) {
      console.error("Failed to complete task:", error)
    }
  }

  const handleViewAllTasks = () => {
    router.push("/dashboard/follow-ups")
  }

  const handleEditTask = (taskId: string) => {
    router.push(`/dashboard/follow-ups/${taskId}`)
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getPriorityIcon = (priority: string, status: string) => {
    if (status === "overdue") return <AlertCircle className="h-4 w-4 text-red-500" />
    if (priority === "urgent" || priority === "high") return <Clock className="h-4 w-4 text-orange-500" />
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Tasks</CardTitle>
          <Button variant="outline" size="sm" onClick={handleViewAllTasks}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Tasks</CardTitle>
        <Button variant="outline" size="sm" onClick={handleViewAllTasks}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const daysUntilDue = getDaysUntilDue(task.due_date)
            const isOverdue = daysUntilDue < 0

            return (
              <div key={task.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                {getPriorityIcon(task.priority, isOverdue ? "overdue" : task.status)}
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">{task.event_name}</h4>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(isOverdue ? "overdue" : task.status)}>
                      {isOverdue ? "overdue" : task.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleEditTask(task.id)}
                    title="Edit task"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCompleteTask(task.id)}
                    title="Mark as completed"
                    disabled={task.status === "completed"}
                  >
                    <CheckCircle className={`h-3 w-3 ${task.status === "completed" ? "text-green-500" : ""}`} />
                  </Button>
                </div>
              </div>
            )
          })}
          {tasks.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">No upcoming tasks found</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
