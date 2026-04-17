"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, CheckCircle2, Circle, Trash2, Edit, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GeneralTask {
  id: string
  title: string
  description: string | null
  due_date: string | null
  priority: string
  status: string
  created_at: string
  assigned_user_first_name: string
  assigned_user_last_name: string
}

export function GeneralTasks() {
  const [tasks, setTasks] = useState<GeneralTask[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<GeneralTask | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/general-tasks")
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTask ? `/api/general-tasks/${editingTask.id}` : "/api/general-tasks"
      const method = editingTask ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchTasks()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving task:", error)
    }
  }

  const handleToggleComplete = async (task: GeneralTask) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed"
      const response = await fetch(`/api/general-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetch(`/api/general-tasks/${taskId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleEdit = (task: GeneralTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date ? task.due_date.split("T")[0] : "",
      priority: task.priority,
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: "",
      priority: "medium",
    })
    setEditingTask(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Tasks</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingTask ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No tasks yet. Create your first task!</p>
        ) : (
          <div className="space-y-4">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => handleToggleComplete(task)}
                  className="mt-1 text-muted-foreground hover:text-foreground"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    {task.due_date && isOverdue(task.due_date) && (
                      <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(task)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(task.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {completedTasks.length > 0 && (
              <>
                <div className="text-sm font-medium text-muted-foreground mt-6 mb-2">Completed</div>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 border rounded-lg opacity-60"
                  >
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="mt-1 text-green-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium line-through">{task.title}</h4>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
