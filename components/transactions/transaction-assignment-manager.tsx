"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Assistant {
  id: string
  first_name: string
  last_name: string
  email: string
  assigned_transactions_count: number
}

interface Assignment {
  id: string
  assigned_to_user_id: string
  first_name: string
  last_name: string
  email: string
  assigned_at: string
  notes: string | null
  assigned_by_first_name: string
  assigned_by_last_name: string
}

interface TransactionAssignmentManagerProps {
  transactionId: string
}

export function TransactionAssignmentManager({ transactionId }: TransactionAssignmentManagerProps) {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  useEffect(() => {
    fetchAssistants()
    fetchAssignments()
  }, [transactionId])

  const fetchAssistants = async () => {
    try {
      const response = await fetch("/api/users/assistants")
      if (response.ok) {
        const data = await response.json()
        setAssistants(data.assistants)
      }
    } catch (error) {
      console.error("Error fetching assistants:", error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}/assignments`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  const handleAssign = async () => {
    if (!selectedAssistant) {
      setError("Please select an assistant")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/transactions/${transactionId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantUserId: selectedAssistant,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        setSuccess("Transaction assigned successfully")
        setSelectedAssistant("")
        setNotes("")
        fetchAssignments()
        fetchAssistants() // Refresh counts
      } else {
        const data = await response.json()
        setError(data.error || "Failed to assign transaction")
      }
    } catch (error) {
      console.error("Error assigning transaction:", error)
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (assistantUserId: string) => {
    if (!confirm("Are you sure you want to remove this assignment?")) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/assignments?assistantUserId=${assistantUserId}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        setSuccess("Assignment removed successfully")
        fetchAssignments()
        fetchAssistants() // Refresh counts
      } else {
        const data = await response.json()
        setError(data.error || "Failed to remove assignment")
      }
    } catch (error) {
      console.error("Error removing assignment:", error)
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Filter out assistants already assigned
  const assignedIds = new Set(assignments.map((a) => a.assigned_to_user_id))
  const availableAssistants = assistants.filter((a) => !assignedIds.has(a.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assistant Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Current Assignments */}
        {assignments.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assigned Assistants</Label>
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {assignment.first_name} {assignment.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{assignment.email}</div>
                    {assignment.notes && (
                      <div className="text-sm text-muted-foreground mt-1 italic">{assignment.notes}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Assigned by {assignment.assigned_by_first_name} {assignment.assigned_by_last_name} on{" "}
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(assignment.assigned_to_user_id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign New Assistant */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-medium">Assign New Assistant</Label>

          <div className="space-y-2">
            <Label htmlFor="assistant">Select Assistant</Label>
            <Select value={selectedAssistant} onValueChange={setSelectedAssistant} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an assistant..." />
              </SelectTrigger>
              <SelectContent>
                {availableAssistants.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No available assistants</div>
                ) : (
                  availableAssistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {assistant.first_name} {assistant.last_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {assistant.assigned_transactions_count} assigned
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this assignment..."
              rows={2}
              disabled={loading}
            />
          </div>

          <Button onClick={handleAssign} disabled={loading || !selectedAssistant} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? "Assigning..." : "Assign Transaction"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
