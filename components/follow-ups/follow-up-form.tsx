"use client"

import type React from "react"
import { Loader2 } from "lucide-react" // Import Loader2 here

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { DocumentManager } from "@/components/documents/document-manager"

interface Transaction {
  id: string
  transaction_type: string
  property_address: string
  property_city: string
  property_state: string
}

interface User {
  id: string
  first_name: string
  last_name: string
}

interface FollowUpFormProps {
  initialData?: {
    id?: string
    event_name?: string
    description?: string
    due_date?: string
    priority?: string
    status?: string
    transaction_id?: string
    assigned_to?: string
    notes?: string
  }
  returnTo?: string
  onSuccess?: () => void
}

export function FollowUpForm({ initialData, returnTo, onSuccess }: FollowUpFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [date, setDate] = useState<Date>()

  const [formData, setFormData] = useState({
    event_name: initialData?.event_name || "",
    description: initialData?.description || "",
    priority: initialData?.priority || "medium",
    status: initialData?.status || "pending",
    transaction_id: initialData?.transaction_id || "",
    assigned_to: initialData?.assigned_to || "",
    notes: initialData?.notes || "",
  })

  const isTransactionPreset = Boolean(initialData?.transaction_id)

  useEffect(() => {
    if (!isTransactionPreset) {
      fetchTransactions()
    }
    fetchUsers()
    if (initialData?.due_date) {
      setDate(new Date(initialData.due_date))
    }
  }, [initialData, isTransactionPreset])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions")
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    setLoading(true)
    try {
      const payload = {
        ...formData,
        due_date: format(date, "yyyy-MM-dd"),
      }

      const url = initialData?.id ? `/api/follow-ups/${initialData.id}` : "/api/follow-ups"
      const method = initialData?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        } else if (returnTo) {
          router.push(returnTo)
        } else if (formData.transaction_id) {
          router.push(`/dashboard/transactions/${formData.transaction_id}/edit`)
        } else {
          router.push("/dashboard/transactions")
        }
      } else {
        console.error("Error saving follow-up:", responseData)
      }
    } catch (error) {
      console.error("Error saving follow-up:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (returnTo) {
      router.push(returnTo)
    } else if (formData.transaction_id) {
      router.push(`/dashboard/transactions/${formData.transaction_id}/edit`)
    } else {
      router.back()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{initialData?.id ? "Edit Follow-up" : "Create Follow-up"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Event Name *</Label>
                <Input
                  id="event_name"
                  value={formData.event_name}
                  onChange={(e) => handleInputChange("event_name", e.target.value)}
                  placeholder="e.g., Home Inspection"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the follow-up task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={date ? format(date, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Parse the date string as local date to avoid timezone issues
                      const [year, month, day] = e.target.value.split('-').map(Number)
                      const newDate = new Date(year, month - 1, day)
                      setDate(newDate)
                    } else {
                      setDate(undefined)
                    }
                  }}
                  className="cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange("assigned_to", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!isTransactionPreset && (
              <div className="space-y-2">
                <Label htmlFor="transaction_id">Related Transaction</Label>
                <Select value={formData.transaction_id} onValueChange={(value) => handleInputChange("transaction_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactions.map((transaction) => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        {transaction.transaction_type.toUpperCase()} - {transaction.property_address},{" "}
                        {transaction.property_city}, {transaction.property_state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || !date}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData?.id ? "Update Follow-up" : "Create Follow-up"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {initialData?.id && <DocumentManager taskId={initialData.id} transactionId={formData.transaction_id} />}
    </div>
  )
}
