"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit, Phone, Mail, MapPin, Building, Globe } from "lucide-react"
import Link from "next/link"

interface Lender {
  lender_uuid: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  license_number: string
  website: string
  notes: string
  created_at: string
}

interface LenderDetailsProps {
  lender: Lender
  transactions?: any[]
}

export function LenderDetailsNew({ lender, transactions = [] }: LenderDetailsProps) {
  const totalLoans = transactions.length
  const totalLoanAmount = transactions.reduce((sum, t) => sum + (t.purchase_price || 0), 0)
  const activeLoans = transactions.filter((t) => t.status === "under_contract" || t.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{lender.company_name}</h1>
          {lender.contact_name && <p className="text-muted-foreground">Contact: {lender.contact_name}</p>}
        </div>
        <Link href={`/dashboard/lenders/${lender.lender_uuid}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lender
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lender Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lender Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lender.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lender.email}</span>
                  </div>
                )}
                {lender.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lender.phone}</span>
                  </div>
                )}
                {lender.license_number && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>License: {lender.license_number}</span>
                  </div>
                )}
                {lender.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={lender.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {(lender.address || lender.city || lender.state) && (
                <div>
                  <h4 className="font-medium mb-2">Address</h4>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {lender.address && <p>{lender.address}</p>}
                      {(lender.city || lender.state) && (
                        <p>
                          {lender.city}
                          {lender.city && lender.state && ", "}
                          {lender.state} {lender.zip_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {lender.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{lender.notes}</p>
                </div>
              )}
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
                        <p className="font-medium">{transaction.property_address}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${transaction.purchase_price?.toLocaleString()}</p>
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
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Loans</p>
                <p className="text-2xl font-bold">{totalLoans}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold">{activeLoans}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Loan Amount</p>
                <p className="text-2xl font-bold">${totalLoanAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-sm">{new Date(lender.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
