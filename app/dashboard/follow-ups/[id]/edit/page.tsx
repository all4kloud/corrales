"use client"

import { use } from "react"
import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpForm } from "@/components/follow-ups/follow-up-form"
import { InspectionRequestManager } from "@/components/follow-ups/inspection-request-manager"
import { EntityEmailManager, type EntityType } from "@/components/follow-ups/entity-email-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, ChevronsLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface FollowUpData {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: string
  status: string
  transaction_id: string
  assigned_to: string
  notes: string
  is_inspection_related: boolean
  inspection_type_name: string | null
  inspection_type_id: string | null
  template_id: string | null
  related_entity_type: EntityType | null
}

interface TaskSummary {
  id: string
  event_name: string
  status: string
  priority: string
  due_date: string | null
}


export default function EditFollowUpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [followUp, setFollowUp]   = useState<FollowUpData | null>(null)
  const [taskList, setTaskList]   = useState<TaskSummary[]>([])
  const [loading, setLoading]     = useState(true)
  const [saved, setSaved]         = useState(false)
  const router = useRouter()

  const fetchFollowUp = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${id}`)
      if (response.ok) {
        const data = await response.json()
        setFollowUp(data.followUp)
        return data.followUp as FollowUpData
      } else {
        router.push("/dashboard/transactions")
        return null
      }
    } catch (error) {
      console.error("Error fetching follow-up:", error)
      router.push("/dashboard/transactions")
      return null
    }
  }, [router])

  const fetchTaskList = useCallback(async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/follow-ups`)
      if (response.ok) {
        const data = await response.json()
        setTaskList(data.followUps || [])
      }
    } catch (error) {
      console.error("Error fetching task list:", error)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const fu = await fetchFollowUp(id)
      if (fu?.transaction_id) {
        await fetchTaskList(fu.transaction_id)
      }
      setLoading(false)
    }
    load()
  }, [id, fetchFollowUp, fetchTaskList])

  // Refresh task list status pill after a save
  const handleSuccess = useCallback(async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    // Refresh both follow-up data and task list summary
    const fu = await fetchFollowUp(id)
    if (fu?.transaction_id) {
      await fetchTaskList(fu.transaction_id)
    }
  }, [id, fetchFollowUp, fetchTaskList])

  const currentIndex = taskList.findIndex((t) => t.id === id)
  const prevTask = currentIndex > 0 ? taskList[currentIndex - 1] : null
  const nextTask = currentIndex < taskList.length - 1 ? taskList[currentIndex + 1] : null

  const returnUrl = followUp?.transaction_id
    ? `/dashboard/transactions/${followUp.transaction_id}/edit`
    : "/dashboard/transactions"

  const navigateToTask = (taskId: string) => {
    router.push(
      `/dashboard/follow-ups/${taskId}/edit?returnTo=${encodeURIComponent(returnUrl)}`
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading follow-up details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!followUp) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Follow-up not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header row */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={returnUrl}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{followUp.event_name}</h1>
            {taskList.length > 0 && currentIndex >= 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Task {currentIndex + 1} of {taskList.length}
              </p>
            )}
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </div>
          )}
        </div>

        {/* Task navigation bar */}
        {taskList.length > 1 && (
          <div className="flex items-center gap-3 border rounded-lg px-4 py-2.5 bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => taskList[0] && navigateToTask(taskList[0].id)}
              className="flex items-center gap-1.5"
              title="Go to first task"
            >
              <ChevronsLeft className="h-4 w-4" />
              1st Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!prevTask}
              onClick={() => prevTask && navigateToTask(prevTask.id)}
              className="flex items-center gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>

            <div className="flex-1 text-center">
              <p className="text-sm font-medium text-foreground truncate">{followUp.event_name}</p>
              <p className="text-xs text-muted-foreground">
                {currentIndex + 1} of {taskList.length} tasks
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={!nextTask}
              onClick={() => nextTask && navigateToTask(nextTask.id)}
              className="flex items-center gap-1.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Form — onSuccess stays on page */}
        <FollowUpForm
          initialData={followUp}
          returnTo={returnUrl}
          onSuccess={handleSuccess}
        />

        {/* Inspection Request Manager */}
        {followUp.is_inspection_related && followUp.transaction_id && (
          <InspectionRequestManager
            followUpId={followUp.id}
            transactionId={followUp.transaction_id}
            inspectionType={followUp.inspection_type_name || ""}
            inspectionTypeId={followUp.inspection_type_id || ""}
            isInspectionRelated={followUp.is_inspection_related}
          />
        )}

        {/* Entity Email Manager */}
        {followUp.related_entity_type && followUp.transaction_id && (
          <EntityEmailManager
            followUpEventId={followUp.id}
            transactionId={followUp.transaction_id}
            entityType={followUp.related_entity_type}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
