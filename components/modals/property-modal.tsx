"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

interface PropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PropertyModal({ open, onOpenChange, onSuccess }: PropertyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zip_code: "",
    property_type: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    lot_size: "",
    year_built: "",
    listing_price: "",
    market_value: "",
    mls_number: "",
    description: "",
    features: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          bedrooms: formData.bedrooms ? Number.parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? Number.parseFloat(formData.bathrooms) : null,
          square_feet: formData.square_feet ? Number.parseInt(formData.square_feet) : null,
          lot_size: formData.lot_size ? Number.parseFloat(formData.lot_size) : null,
          year_built: formData.year_built ? Number.parseInt(formData.year_built) : null,
          listing_price: formData.listing_price ? Number.parseFloat(formData.listing_price) : null,
          market_value: formData.market_value ? Number.parseFloat(formData.market_value) : null,
          features: formData.features ? formData.features.split(",").map((f) => f.trim()) : [],
        }),
      })

      if (response.ok) {
        if (onSuccess) {
          onSuccess()
        }
        onOpenChange(false)
        // Reset form
        setFormData({
          address: "",
          city: "",
          state: "",
          zip_code: "",
          property_type: "",
          bedrooms: "",
          bathrooms: "",
          square_feet: "",
          lot_size: "",
          year_built: "",
          listing_price: "",
          market_value: "",
          mls_number: "",
          description: "",
          features: "",
        })
      }
    } catch (error) {
      console.error("Error creating property:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code *</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleChange("zip_code", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property_type">Property Type</Label>
              <Select value={formData.property_type} onValueChange={(value) => handleChange("property_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi_family">Multi Family</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mls_number">MLS Number</Label>
              <Input
                id="mls_number"
                value={formData.mls_number}
                onChange={(e) => handleChange("mls_number", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => handleChange("bedrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => handleChange("bathrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="square_feet">Square Feet</Label>
              <Input
                id="square_feet"
                type="number"
                value={formData.square_feet}
                onChange={(e) => handleChange("square_feet", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_built">Year Built</Label>
              <Input
                id="year_built"
                type="number"
                value={formData.year_built}
                onChange={(e) => handleChange("year_built", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lot_size">Lot Size (acres)</Label>
              <Input
                id="lot_size"
                type="number"
                step="0.01"
                value={formData.lot_size}
                onChange={(e) => handleChange("lot_size", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listing_price">Listing Price</Label>
              <Input
                id="listing_price"
                type="number"
                step="0.01"
                value={formData.listing_price}
                onChange={(e) => handleChange("listing_price", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market_value">Market Value</Label>
              <Input
                id="market_value"
                type="number"
                step="0.01"
                value={formData.market_value}
                onChange={(e) => handleChange("market_value", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (comma-separated)</Label>
            <Input
              id="features"
              placeholder="e.g., Pool, Garage, Fireplace, Updated Kitchen"
              value={formData.features}
              onChange={(e) => handleChange("features", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Property"}
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
