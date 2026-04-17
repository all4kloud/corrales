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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewPropertyPage() {
  const router = useRouter()
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
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Submitting property data:", formData)

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          bedrooms: Number.parseInt(formData.bedrooms) || null,
          bathrooms: Number.parseFloat(formData.bathrooms) || null,
          square_feet: Number.parseInt(formData.square_feet) || null,
          lot_size: Number.parseFloat(formData.lot_size) || null,
          year_built: Number.parseInt(formData.year_built) || null,
          listing_price: Number.parseFloat(formData.listing_price) || null,
        }),
      })

      const result = await response.json()
      console.log("[v0] API response:", result)

      if (response.ok) {
        console.log("[v0] Property created successfully, redirecting...")
        router.push("/dashboard/properties")
      } else {
        console.error("Failed to create property:", result)
        alert(`Failed to create property: ${result.error}${result.details ? ` - ${result.details}` : ""}`)
      }
    } catch (error) {
      console.error("Error creating property:", error)
      alert("Error creating property. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add New Property</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
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
              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
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
                <Label htmlFor="year_built">Year Built</Label>
                <Input
                  id="year_built"
                  type="number"
                  value={formData.year_built}
                  onChange={(e) => handleChange("year_built", e.target.value)}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Property"}
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
