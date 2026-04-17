"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft, User, Mail, Phone, MapPin, FileText, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ClientDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  visa_type: string
  language: string // Added language field to interface
  notes: string
  created_at: string
  updated_at: string
}

interface Transaction {
  id: string
  transaction_type: string
  status: string
  purchase_price: number
  property_address: string
  property_city: string
  property_state: string
  closing_date: string
}

export function ClientDetails({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchClient()
    fetchClientTransactions()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else {
        router.push("/dashboard/clients")
      }
    } catch (error) {
      console.error("Error fetching client:", error)
      router.push("/dashboard/clients")
    } finally {
      setLoading(false)
    }
  }

  const fetchClientTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?client_id=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error("Error fetching client transactions:", error)
    } finally {
      setTransactionsLoading(false)
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading client details...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="text-center">Client not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Client Details</h1>
            <p className="text-muted-foreground">
              {client.first_name} {client.last_name}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Client Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">
                    {client.first_name} {client.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client Since</p>
                  <p className="font-semibold">{formatDate(client.created_at)}</p>
                </div>
                {client.visa_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Visa Type</p>
                    <p className="font-semibold">{client.visa_type}</p>
                  </div>
                )}
                {client.language && (
                  <div>
                    <p className="text-sm text-muted-foreground">Language</p>
                    <p className="font-semibold">{client.language}</p>
                  </div>
                )}
              </div>

              {client.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <Button size="sm" asChild>
                <Link href={`/dashboard/transactions/new?client_id=${clientId}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  New Transaction
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-4">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Create a new transaction to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline">{transaction.transaction_type}</Badge>
                        </div>
                        <p className="font-medium text-sm">
                          {transaction.property_address}, {transaction.property_city}, {transaction.property_state}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatCurrency(transaction.purchase_price)}</span>
                          <span>Closing: {formatDate(transaction.closing_date)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/transactions/${transaction.id}`}>View Details</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          {(client.address || client.city || client.state || client.zip_code || client.country) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.address && <p className="font-medium">{client.address}</p>}
                {(client.city || client.state || client.zip_code) && (
                  <p className="text-muted-foreground">
                    {[client.city, client.state, client.zip_code].filter(Boolean).join(", ")}
                  </p>
                )}
                {client.country && <p className="text-muted-foreground mt-1">{client.country}</p>}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transactions</span>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Transactions</span>
                <span className="font-medium">
                  {transactions.filter((t) => !["closed", "cancelled"].includes(t.status)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closed Transactions</span>
                <span className="font-medium">{transactions.filter((t) => t.status === "closed").length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
