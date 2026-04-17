"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface LenderFormProps {
  lenderId?: string
}

export function LenderForm({ lenderId }: LenderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    loan_types: [] as string[],
    notes: "",
  })

  useEffect(() => {
    if (lenderId) {
      fetchLender()
    }
  }, [lenderId])

  const fetchLender = async () => {
    try {
      const response = await fetch(`/api/lenders/${lenderId}`)
      if (response.ok) {
        const data = await response.json()
        const lender = data.lender
        setFormData({
          company_name: lender.company_name || "",
          contact_name: lender.contact_name || "",
          email: lender.email || "",
          phone: lender.phone || "",
          address: lender.address || "",
          loan_types: lender.loan_types || [],
          notes: lender.notes || "",
        })
      }
    } catch (error) {
      console.error("Error fetching lender:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = lenderId ? `/api/lenders/${lenderId}` : "/api/lenders"
      const method = lenderId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/dashboard/lenders")
      } else {
        const result = await response.json()
        alert(`Error saving lender: ${result.error}${result.details ? ` - ${result.details}` : ""}`)
      }
    } catch (error) {
      console.error("Error saving lender:", error)
      alert("Error saving lender. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLoanTypeChange = (value: string) => {
    const types = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)
    setFormData((prev) => ({ ...prev, loan_types: types }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/lenders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{lenderId ? "Edit Lender" : "New Lender"}</h1>
          <p className="text-muted-foreground">
            {lenderId ? "Update lender information" : "Add a new mortgage lender"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="ABC Mortgage Company"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Primary Contact</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => handleChange("contact_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contact@abcmortgage.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan_types">Loan Types</Label>
                <Input
                  id="loan_types"
                  value={formData.loan_types.join(", ")}
                  onChange={(e) => handleLoanTypeChange(e.target.value)}
                  placeholder="Conventional, FHA, VA (comma separated)"
                />
                <p className="text-xs text-muted-foreground">Enter loan types separated by commas</p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this lender..."
                rows={4}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : lenderId ? "Update Lender" : "Create Lender"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/lenders">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
