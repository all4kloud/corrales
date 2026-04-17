"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trash2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Customer {
  id: string
  first_name: string
  last_name: string
}

interface Transaction {
  id: string
  transaction_type: string
  status: string
  priority: string
  purchase_price: number
  due_diligence_date: string
  closing_date: string
  property_address: string
  property_city: string
  property_state: string
  property_zip_code?: string
  buyers?: Customer[]
  sellers?: Customer[]
  listing_agent_first_name?: string
  listing_agent_last_name?: string
  co_listing_agent_first_name?: string
  co_listing_agent_last_name?: string
  buyer_agent_first_name?: string
  buyer_agent_last_name?: string
  co_buyer_agent_first_name?: string
  co_buyer_agent_last_name?: string
  total_tasks: number
  completed_tasks: number
}

interface TransactionFiltersState {
  search: string
  status: string
  priority: string
  type: string
}

interface TransactionsListProps {
  filters?: TransactionFiltersState
}

const PAGE_SIZE = 15

export function TransactionsList({ filters }: TransactionsListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchTransactions = useCallback(async (currentPage: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort: "closing_date",
        order: "asc",
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
      })
      if (filters?.search)   params.set("search",   filters.search)
      if (filters?.status   && filters.status   !== "all") params.set("status",   filters.status)
      if (filters?.priority && filters.priority !== "all") params.set("priority", filters.priority)
      if (filters?.type     && filters.type     !== "all") params.set("type",     filters.type)

      const response = await fetch(`/api/transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Reset to page 1 when filters change, then fetch
  useEffect(() => {
    setPage(1)
  }, [filters])

  // Fetch whenever page or filters change
  useEffect(() => {
    fetchTransactions(page)
  }, [page, fetchTransactions])

  const filteredTransactions = transactions

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    // Parse date as local date to avoid timezone issues
    const datePart = dateString.split("T")[0]
    const [year, month, day] = datePart.split("-")
    return `${month}/${day}/${year}`
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction? It will be hidden from view.")) {
      return
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTransactions(page)
      } else {
        console.error("Error deleting transaction")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
    }
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading transactions...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Transactions</CardTitle>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {total} {total === 1 ? "transaction" : "transactions"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {transactions.length === 0 
                ? "No transactions found. Create your first transaction to get started."
                : "No transactions match your filters. Try adjusting your search criteria."}
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <ContextMenu key={transaction.id}>
                <ContextMenuTrigger>
                  <div
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/transactions/${transaction.id}/edit`)}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                      <h4 className="font-medium">
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
                        {/* Client name */}
                        {(() => {
                          const isPurchase = transaction.transaction_type === "purchase"
                          const clients = isPurchase ? transaction.buyers : transaction.sellers
                          if (!clients || clients.length === 0) return null
                          const first = clients[0]
                          const label = `${first.first_name} ${first.last_name}${clients.length > 1 ? ` y otro(s)` : ""}`
                          return (
                            <span>
                              <span className="font-medium">Cliente:</span> {label}
                            </span>
                          )
                        })()}

                        {/* Agent — always show the primary agent for the transaction type */}
                        {transaction.transaction_type === "purchase" ? (
                          <>
                            {transaction.buyer_agent_first_name && (
                              <span>
                                <span className="font-medium">Buyer Agent:</span> {transaction.buyer_agent_first_name}{" "}
                                {transaction.buyer_agent_last_name}
                              </span>
                            )}
                            {transaction.co_buyer_agent_first_name && (
                              <span>
                                <span className="font-medium">Co-Buyer Agent:</span> {transaction.co_buyer_agent_first_name}{" "}
                                {transaction.co_buyer_agent_last_name}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {transaction.listing_agent_first_name && (
                              <span>
                                <span className="font-medium">Listing Agent:</span> {transaction.listing_agent_first_name}{" "}
                                {transaction.listing_agent_last_name}
                              </span>
                            )}
                            {transaction.co_listing_agent_first_name && (
                              <span>
                                <span className="font-medium">Co-Listing Agent:</span> {transaction.co_listing_agent_first_name}{" "}
                                {transaction.co_listing_agent_last_name}
                              </span>
                            )}
                          </>
                        )}
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
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Transaction
                    </ContextMenuItem>
                  </ContextMenuContent>
                )}
              </ContextMenu>
            ))
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page number buttons — show up to 5 around current */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...")
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, i) =>
                    item === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(item as number)}
                        disabled={loading}
                      >
                        {item}
                      </Button>
                    )
                  )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
