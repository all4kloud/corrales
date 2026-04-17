"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trash2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"

interface Transaction {
  id: string
  property_address: string
  property_city: string
  property_state: string
  property_zip_code?: string
  transaction_type: string
  status: string
  priority: string
  purchase_price: number
  closing_date: string
  due_diligence_date: string | null
  buyer_first_name: string
  buyer_last_name: string
  seller_first_name: string
  seller_last_name: string
  listing_agent_first_name: string
  listing_agent_last_name: string
  buyer_agent_first_name: string
  buyer_agent_last_name: string
  total_tasks: number
  completed_tasks: number
}

interface RecentTransactionsProps {
  filters?: {
    search: string
    status: string
    priority: string
    timeRange: string
  }
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A"
  // Parse date as local date to avoid timezone issues
  // Database dates come as "YYYY-MM-DD" or ISO strings
  const datePart = dateString.split("T")[0]
  const [year, month, day] = datePart.split("-")
  return `${month}/${day}/${year}`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function RecentTransactions({ filters }: RecentTransactionsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const params = new URLSearchParams({
          limit: "5",
          sort: "closing_date",
          order: "asc",
        })

        if (filters?.status && filters.status !== "all") {
          params.append("status", filters.status)
        }
        if (filters?.priority && filters.priority !== "all") {
          params.append("priority", filters.priority)
        }
        if (filters?.search) {
          params.append("search", filters.search)
        }

        const response = await fetch(`/api/transactions?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [filters]) // Re-fetch when filters change

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "under_contract":
        return "bg-blue-100 text-blue-800"
      case "contingent":
        return "bg-orange-100 text-orange-800"
      case "closed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
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

  const handleViewTransaction = (id: string) => {
    router.push(`/dashboard/transactions/${id}`)
  }

  const handleEditTransaction = (id: string) => {
    router.push(`/dashboard/transactions/${id}/edit`)
  }

  const handleDeleteTransaction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this transaction? It will be hidden from view.")) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove from local state
        setTransactions(transactions.filter((t) => t.id !== id))
      } else {
        alert("Failed to delete transaction")
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error)
      alert("Failed to delete transaction")
    }
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
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
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/transactions">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <ContextMenu key={transaction.id}>
              <ContextMenuTrigger>
                <div
                  className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/dashboard/transactions/${transaction.id}/edit`)}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-sm">
                        {transaction.property_address}, {transaction.property_city}, {transaction.property_state} {transaction.property_zip_code}
                      </h4>
                      <Badge className={getPriorityColor(transaction.priority)}>{transaction.priority}</Badge>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Type:</span> {transaction.transaction_type}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> {formatCurrency(transaction.purchase_price)}
                      </div>
                      <div>
                        <span className="font-medium">Due Diligence:</span>{" "}
                        {transaction.due_diligence_date ? formatDate(transaction.due_diligence_date) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Closing:</span> {formatDate(transaction.closing_date)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {transaction.buyer_first_name && (
                        <span>
                          <span className="font-medium">Buyer:</span> {transaction.buyer_first_name}{" "}
                          {transaction.buyer_last_name}
                        </span>
                      )}
                      {transaction.seller_first_name && (
                        <span>
                          <span className="font-medium">Seller:</span> {transaction.seller_first_name}{" "}
                          {transaction.seller_last_name}
                        </span>
                      )}
                      {/* Show buyer agent for purchase transactions, listing agent for others */}
                      {transaction.transaction_type === "purchase" && transaction.buyer_agent_first_name ? (
                        <span>
                          <span className="font-medium">Agent:</span> {transaction.buyer_agent_first_name}{" "}
                          {transaction.buyer_agent_last_name}
                        </span>
                      ) : transaction.listing_agent_first_name ? (
                        <span>
                          <span className="font-medium">Agent:</span> {transaction.listing_agent_first_name}{" "}
                          {transaction.listing_agent_last_name}
                        </span>
                      ) : null}
                    </div>

                    {/* Task Progress Bar */}
                    {transaction.total_tasks > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Tasks Progress</span>
                          </div>
                          <span className="font-medium">
                            {transaction.completed_tasks}/{transaction.total_tasks}
                          </span>
                        </div>
                        <Progress 
                          value={(transaction.completed_tasks / transaction.total_tasks) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>
              {canDelete && (
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => handleDeleteTransaction(transaction.id, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Transaction
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
            </ContextMenu>
          ))}
          {transactions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">No recent transactions found</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
