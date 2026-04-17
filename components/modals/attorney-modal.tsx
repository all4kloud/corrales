"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

interface AttorneyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AttorneyModal({ open, onOpenChange, onSuccess }: AttorneyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firm_name: "",
    attorney_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    bar_number: "",
    specialties: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/attorneys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialties: formData.specialties ? formData.specialties.split(",").map((s) => s.trim()) : [],
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        }
        onOpenChange(false)
        // Reset form
        setFormData({
          firm_name: "",
          attorney_name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          bar_number: "",
          specialties: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error creating attorney:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Attorney</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firm_name">Firm Name *</Label>
              <Input
                id="firm_name"
                value={formData.firm_name}
                onChange={(e) => handleChange("firm_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attorney_name">Attorney Name *</Label>
              <Input
                id="attorney_name"
                value={formData.attorney_name}
                onChange={(e) => handleChange("attorney_name", e.target.value)}
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
              <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleChange("zip_code", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bar_number">Bar Number</Label>
            <Input
              id="bar_number"
              value={formData.bar_number}
              onChange={(e) => handleChange("bar_number", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties (comma-separated)</Label>
            <Input
              id="specialties"
              placeholder="e.g., Real Estate, Corporate, Family Law"
              value={formData.specialties}
              onChange={(e) => handleChange("specialties", e.target.value)}
            />
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

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Attorney"}
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
