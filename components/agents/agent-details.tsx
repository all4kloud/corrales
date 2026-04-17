"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit, Phone, Mail, Award, Building } from "lucide-react"
import Link from "next/link"

interface Agent {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  license_number: string
  brokerage: string
  commission_rate: number
  specialties: string[]
  bio?: string
  active_transactions: number
  created_at: string
}

interface AgentDetailsProps {
  agent: Agent
  transactions?: any[]
}

export function AgentDetails({ agent, transactions = [] }: AgentDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  const totalSales = transactions.reduce((sum, transaction) => {
    return sum + (transaction.purchase_price || 0)
  }, 0)

  const closedTransactions = transactions.filter((t) => t.status === "closed")
  const activeTransactions = transactions.filter((t) => t.status !== "closed" && t.status !== "cancelled")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {agent.first_name} {agent.last_name}
          </h1>
          <p className="text-muted-foreground">{agent.brokerage}</p>
        </div>
        <Link href={`/dashboard/agents/${agent.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Agent
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{agent.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{agent.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>License: {agent.license_number}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>Commission: {formatPercentage(agent.commission_rate)}</span>
                </div>
              </div>

              <Separator />

              {agent.specialties && agent.specialties.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {agent.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-sm text-muted-foreground">{agent.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Total Sales Volume</h4>
                  <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Closed Transactions</h4>
                  <p className="text-2xl font-bold">{closedTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{transaction.property_address || "Property Address"}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.buyer_first_name && transaction.buyer_last_name
                            ? `${transaction.buyer_first_name} ${transaction.buyer_last_name}`
                            : "Client"}{" "}
                          • {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.purchase_price || 0)}</p>
                        <Badge variant={transaction.status === "closed" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{activeTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed Deals</p>
                <p className="text-2xl font-bold">{closedTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales Volume</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-sm">{new Date(agent.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
