"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, KeyRound, Copy, Check } from "lucide-react"
import Link from "next/link"

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "United States",
    client_type: "buyer",
    status: "active",
    visa_type: "",
    language: "English",
    notes: "",
    enable_portal_access: false,
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [portalCredentials, setPortalCredentials] = useState<{
    email: string
    temporary_password: string
    login_url: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const validateUSAddress = () => {
    const errors: Record<string, string> = {}

    if (formData.country === "United States") {
      const usStates = [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
        "DC",
      ]

      if (formData.state && !usStates.includes(formData.state.toUpperCase())) {
        errors.state = "Please enter a valid US state code (e.g., NC, CA, NY)"
      }

      const zipRegex = /^\d{5}(-\d{4})?$/
      if (formData.zip_code && !zipRegex.test(formData.zip_code)) {
        errors.zip_code = "Please enter a valid US ZIP code (e.g., 27258 or 27258-1234)"
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateUSAddress()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.portal_credentials) {
          setPortalCredentials(data.portal_credentials)
        } else {
          router.push("/dashboard/clients")
        }
      } else {
        console.error("Failed to create client")
      }
    } catch (error) {
      console.error("Error creating client:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const copyCredentials = () => {
    if (portalCredentials) {
      const text = `Portal Login Credentials\n\nEmail: ${portalCredentials.email}\nTemporary Password: ${portalCredentials.temporary_password}\nLogin URL: ${window.location.origin}${portalCredentials.login_url}\n\nPlease change your password after first login.`
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (portalCredentials) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Client Created Successfully</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Portal Access Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Important: Save these credentials</AlertTitle>
              <AlertDescription>
                These credentials will only be shown once. Please save them or send them to the client.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-3 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-semibold">{portalCredentials.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Temporary Password:</span>{" "}
                <span className="font-semibold">{portalCredentials.temporary_password}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Login URL:</span>{" "}
                <span className="font-semibold">
                  {window.location.origin}
                  {portalCredentials.login_url}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={copyCredentials} variant="outline">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button onClick={() => router.push("/dashboard/clients")}>Go to Clients List</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add New Client</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => handleChange("middle_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_type">Client Type</Label>
                <Select value={formData.client_type} onValueChange={(value) => handleChange("client_type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="visa_type">Visa Type</Label>
                <Select value={formData.visa_type} onValueChange={(value) => handleChange("visa_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visa type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US Citizen">US Citizen</SelectItem>
                    <SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
                    <SelectItem value="Nonimmigrant">Nonimmigrant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={formData.language} onValueChange={(value) => handleChange("language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
                    placeholder={formData.country === "United States" ? "e.g., NC" : ""}
                    className={validationErrors.state ? "border-red-500" : ""}
                  />
                  {validationErrors.state && <p className="text-sm text-red-500">{validationErrors.state}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleChange("zip_code", e.target.value)}
                    placeholder={formData.country === "United States" ? "e.g., 27258" : ""}
                    className={validationErrors.zip_code ? "border-red-500" : ""}
                  />
                  {validationErrors.zip_code && <p className="text-sm text-red-500">{validationErrors.zip_code}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable_portal_access"
                  checked={formData.enable_portal_access}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, enable_portal_access: checked === true }))
                  }
                />
                <Label htmlFor="enable_portal_access" className="font-medium cursor-pointer">
                  Enable Portal Access
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Allow this client to access the customer portal to view their transaction status. A temporary password
                will be generated that you can share with the client.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Client"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
