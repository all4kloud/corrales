"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Save, KeyRound, Copy, Check } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface ClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ClientModal({ open, onOpenChange, onSuccess }: ClientModalProps) {
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
        errors.state = "Please enter a valid US state code"
      }

      const zipRegex = /^\d{5}(-\d{4})?$/
      if (formData.zip_code && !zipRegex.test(formData.zip_code)) {
        errors.zip_code = "Please enter a valid US ZIP code"
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.portal_credentials) {
          setPortalCredentials(data.portal_credentials)
          if (onSuccess) {
            onSuccess()
          }
        } else {
          if (onSuccess) {
            onSuccess()
          }
          resetAndClose()
        }
      }
    } catch (error) {
      console.error("Error creating client:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    onOpenChange(false)
    setFormData({
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
      visa_type: "",
      language: "English",
      notes: "",
      enable_portal_access: false,
    })
    setValidationErrors({})
    setPortalCredentials(null)
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
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Portal Access Credentials
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTitle>Client Created Successfully!</AlertTitle>
              <AlertDescription>Save these credentials - they will only be shown once.</AlertDescription>
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
              <Button onClick={copyCredentials} variant="outline" className="flex-1 bg-transparent">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button onClick={resetAndClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                className={validationErrors.state ? "border-red-500" : ""}
              />
              {validationErrors.state && <p className="text-xs text-red-500">{validationErrors.state}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleChange("zip_code", e.target.value)}
                className={validationErrors.zip_code ? "border-red-500" : ""}
              />
              {validationErrors.zip_code && <p className="text-xs text-red-500">{validationErrors.zip_code}</p>}
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable_portal_access_modal"
                checked={formData.enable_portal_access}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, enable_portal_access: checked === true }))
                }
              />
              <Label htmlFor="enable_portal_access_modal" className="font-medium cursor-pointer">
                Enable Portal Access
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Create a portal account so this client can view their transactions online.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Client"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
