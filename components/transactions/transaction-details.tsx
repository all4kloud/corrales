"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Edit,
  ArrowLeft,
  Calendar,
  DollarSign,
  Home,
  Users,
  FileText,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { TransactionAssignmentManager } from "./transaction-assignment-manager"

interface TransactionDetail {
  id: string
  transaction_type: string
  status: string
  priority: string
  purchase_price: number
  commission_rate: number
  contract_date: string
  closing_date: string
  due_diligence_date: string
  due_diligence_fee: number
  due_diligence_money: number
  brokerage_fee: number
  closing_costs: number
  earnest_money_deposit: number
  notes: string
  property_address: string
  property_city: string
  property_state: string
  property_zip: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  buyer_first_name: string
  buyer_last_name: string
  buyer_email: string
  buyer_phone: string
  seller_first_name: string
  seller_last_name: string
  seller_email: string
  seller_phone: string
  created_at: string
  updated_at: string
}

interface FollowUp {
  id: string
  event_name: string
  description: string
  due_date: string
  priority: string
  status: string
  assigned_first_name: string
  assigned_last_name: string
  notes: string
}

export function TransactionDetails({ transactionId }: { transactionId: string }) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [followUpsLoading, setFollowUpsLoading] = useState(true)
  const [followUpsOpen, setFollowUpsOpen] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    fetchTransaction()
    fetchFollowUps()
    fetchUserRole()
  }, [transactionId])

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user?.role || "")
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
    }
  }

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        const data = await response.json()
        setTransaction(data.transaction)
      } else {
        router.push("/dashboard/transactions")
      }
    } catch (error) {
      console.error("Error fetching transaction:", error)
      router.push("/dashboard/transactions")
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(`/api/follow-ups?transaction_id=${transactionId}`)
      if (response.ok) {
        const data = await response.json()
        setFollowUps(data.followUps || [])
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error)
    } finally {
      setFollowUpsLoading(false)
    }
  }

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setFollowUps((prev) =>
          prev.map((followUp) => (followUp.id === followUpId ? { ...followUp, status: "completed" } : followUp)),
        )
      }
    } catch (error) {
      console.error("Error completing follow-up:", error)
    }
  }

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

  const getFollowUpStatusColor = (status: string) => {
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

  const getFollowUpIcon = (priority: string, status: string) => {
    if (status === "overdue") return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (priority === "urgent" || priority === "high") return <Clock className="h-4 w-4 text-orange-500" />
    return <Clock className="h-4 w-4 text-blue-500" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading transaction details...</div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="space-y-6">
        <div className="text-center">Transaction not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/transactions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transaction Details</h1>
            <p className="text-muted-foreground">
              {transaction.property_address}, {transaction.property_city}, {transaction.property_state}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/transactions/${transaction.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Transaction
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(transaction.status)}>{transaction.status.replace("_", " ")}</Badge>
                <Badge className={getPriorityColor(transaction.priority)}>{transaction.priority}</Badge>
                <Badge variant="outline">{transaction.transaction_type}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-semibold">{formatCurrency(transaction.purchase_price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Closing Date</p>
                    <p className="font-semibold">{formatDate(transaction.closing_date)}</p>
                  </div>
                </div>
              </div>

              {(transaction.due_diligence_date ||
                transaction.due_diligence_fee ||
                transaction.due_diligence_money ||
                transaction.brokerage_fee ||
                transaction.closing_costs ||
                transaction.earnest_money_deposit) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {transaction.due_diligence_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Due Diligence Date</p>
                        <p className="font-semibold">{formatDate(transaction.due_diligence_date)}</p>
                      </div>
                    )}
                    {transaction.due_diligence_fee && (
                      <div>
                        <p className="text-sm text-muted-foreground">Due Diligence Fee</p>
                        <p className="font-semibold">{formatCurrency(transaction.due_diligence_fee)}</p>
                      </div>
                    )}
                    {transaction.due_diligence_money && (
                      <div>
                        <p className="text-sm text-muted-foreground">Due Diligence Money</p>
                        <p className="font-semibold">{formatCurrency(transaction.due_diligence_money)}</p>
                      </div>
                    )}
                    {transaction.earnest_money_deposit && (
                      <div>
                        <p className="text-sm text-muted-foreground">Earnest Money Deposit</p>
                        <p className="font-semibold">{formatCurrency(transaction.earnest_money_deposit)}</p>
                      </div>
                    )}
                    {transaction.brokerage_fee && (
                      <div>
                        <p className="text-sm text-muted-foreground">Brokerage Fee</p>
                        <p className="font-semibold">{formatCurrency(transaction.brokerage_fee)}</p>
                      </div>
                    )}
                    {transaction.closing_costs && (
                      <div>
                        <p className="text-sm text-muted-foreground">Closing Costs</p>
                        <p className="font-semibold">{formatCurrency(transaction.closing_costs)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {transaction.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{transaction.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{transaction.property_address}</p>
                <p className="text-muted-foreground">
                  {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
                </p>
              </div>

              {(transaction.bedrooms || transaction.bathrooms || transaction.square_feet) && (
                <div className="grid grid-cols-3 gap-4">
                  {transaction.bedrooms && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold">{transaction.bedrooms}</p>
                    </div>
                  )}
                  {transaction.bathrooms && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-semibold">{transaction.bathrooms}</p>
                    </div>
                  )}
                  {transaction.square_feet && (
                    <div>
                      <p className="text-sm text-muted-foreground">Square Feet</p>
                      <p className="font-semibold">{transaction.square_feet.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Tasks */}
          <Collapsible open={followUpsOpen} onOpenChange={setFollowUpsOpen}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-0 hover:bg-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Follow-up Tasks ({followUps.length})
                    </CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${followUpsOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/follow-ups/new?transaction_id=${transactionId}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Link>
                </Button>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  {followUpsLoading ? (
                    <div className="text-center py-4">Loading follow-up tasks...</div>
                  ) : followUps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No follow-up tasks yet</p>
                      <p className="text-sm">Tasks will be automatically created when the transaction is saved</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {followUps.map((followUp) => (
                        <div key={followUp.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                          {getFollowUpIcon(followUp.priority, followUp.status)}
                          <div className="flex-1 space-y-1">
                            <h4 className="font-medium text-sm">{followUp.event_name}</h4>
                            {followUp.description && (
                              <p className="text-xs text-muted-foreground">{followUp.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge className={getFollowUpStatusColor(followUp.status)}>{followUp.status}</Badge>
                              <Badge className={getPriorityColor(followUp.priority)}>{followUp.priority}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Due: {formatDate(followUp.due_date)}
                              </span>
                            </div>
                            {followUp.assigned_first_name && (
                              <p className="text-xs text-muted-foreground">
                                Assigned to: {followUp.assigned_first_name} {followUp.assigned_last_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCompleteFollowUp(followUp.id)}
                              title="Mark as completed"
                              disabled={followUp.status === "completed"}
                            >
                              <CheckCircle
                                className={`h-3 w-3 ${followUp.status === "completed" ? "text-green-500" : ""}`}
                              />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" asChild title="Edit task">
                              <Link href={`/dashboard/follow-ups/${followUp.id}/edit`}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        <div className="space-y-6">
          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parties Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.buyer_first_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Buyer</p>
                  <p className="font-semibold">
                    {transaction.buyer_first_name} {transaction.buyer_last_name}
                  </p>
                  {transaction.buyer_email && (
                    <p className="text-sm text-muted-foreground">{transaction.buyer_email}</p>
                  )}
                  {transaction.buyer_phone && (
                    <p className="text-sm text-muted-foreground">{transaction.buyer_phone}</p>
                  )}
                </div>
              )}

              {transaction.seller_first_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Seller</p>
                    <p className="font-semibold">
                      {transaction.seller_first_name} {transaction.seller_last_name}
                    </p>
                    {transaction.seller_email && (
                      <p className="text-sm text-muted-foreground">{transaction.seller_email}</p>
                    )}
                    {transaction.seller_phone && (
                      <p className="text-sm text-muted-foreground">{transaction.seller_phone}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Contract Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(transaction.contract_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Closing Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(transaction.closing_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assistant Assignments - Visible to managers and admins */}
          {(userRole === "manager" || userRole === "admin") && (
            <TransactionAssignmentManager transactionId={transactionId} />
          )}
        </div>
      </div>
    </div>
  )
}
