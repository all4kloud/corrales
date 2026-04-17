"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save } from "lucide-react"

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AgentModal({ open, onOpenChange, onSuccess }: AgentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    license_number: "",
    brokerage: "",
    commission_rate: "",
    specialties: "",
    bio: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const agentResponse = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          license_number: formData.license_number,
          brokerage: formData.brokerage,
          commission_rate: formData.commission_rate ? Number.parseFloat(formData.commission_rate) : null,
          specialties: formData.specialties,
          bio: formData.bio,
        }),
      })

      if (!agentResponse.ok) {
        const errorData = await agentResponse.json()
        throw new Error(errorData.details || errorData.error || "Failed to create agent")
      }

      const data = await agentResponse.json()
      console.log("[v0] Agent created successfully:", data)

      // Reset form
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        phone: "",
        license_number: "",
        brokerage: "",
        commission_rate: "",
        specialties: "",
        bio: "",
      })

      // Close modal first
      onOpenChange(false)

      // Then call onSuccess to refresh the list
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating agent:", error)
      alert(error instanceof Error ? error.message : "Failed to create agent")
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
          <DialogTitle>Add New Agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleChange("license_number", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brokerage">Brokerage</Label>
              <Input
                id="brokerage"
                value={formData.brokerage}
                onChange={(e) => handleChange("brokerage", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (decimal)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.001"
                placeholder="0.025"
                value={formData.commission_rate}
                onChange={(e) => handleChange("commission_rate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties (comma-separated)</Label>
            <Input
              id="specialties"
              placeholder="e.g., Residential, Commercial, First-time buyers"
              value={formData.specialties}
              onChange={(e) => handleChange("specialties", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)} />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Agent"}
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
