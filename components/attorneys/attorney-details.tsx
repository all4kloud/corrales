"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit, Phone, Mail, MapPin, Scale, Globe } from "lucide-react"
import Link from "next/link"

interface Attorney {
  attorney_uuid: string
  firm_name: string
  attorney_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  bar_number: string
  specialties: string[]
  website: string
  notes: string
  created_at: string
}

interface AttorneyDetailsProps {
  attorney: Attorney
  transactions?: any[]
}

export function AttorneyDetails({ attorney, transactions = [] }: AttorneyDetailsProps) {
  const totalCases = transactions.length
  const activeCases = transactions.filter((t) => t.status === "under_contract" || t.status === "pending").length
  const closedCases = transactions.filter((t) => t.status === "closed").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{attorney.firm_name}</h1>
          {attorney.attorney_name && <p className="text-muted-foreground">Attorney: {attorney.attorney_name}</p>}
        </div>
        <Link href={`/dashboard/attorneys/${attorney.attorney_uuid}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Attorney
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attorney Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attorney Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attorney.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{attorney.email}</span>
                  </div>
                )}
                {attorney.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{attorney.phone}</span>
                  </div>
                )}
                {attorney.bar_number && (
                  <div className="flex items-center space-x-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span>Bar #: {attorney.bar_number}</span>
                  </div>
                )}
                {attorney.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={attorney.website}
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

              {attorney.specialties && attorney.specialties.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {attorney.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(attorney.address || attorney.city || attorney.state) && (
                <div>
                  <h4 className="font-medium mb-2">Address</h4>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {attorney.address && <p>{attorney.address}</p>}
                      {(attorney.city || attorney.state) && (
                        <p>
                          {attorney.city}
                          {attorney.city && attorney.state && ", "}
                          {attorney.state} {attorney.zip_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {attorney.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{attorney.notes}</p>
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
              <CardTitle>Case Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{totalCases}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-2xl font-bold">{activeCases}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed Cases</p>
                <p className="text-2xl font-bold">{closedCases}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-sm">{new Date(attorney.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
