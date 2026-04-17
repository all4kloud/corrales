"use client"

import type React from "react"
import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
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

  useEffect(() => {
    fetchProperty()
  }, [id])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`)
      if (response.ok) {
        const data = await response.json()
        const property = data.property

        setFormData({
          address: property.address || "",
          city: property.city || "",
          state: property.state || "",
          zip_code: property.zip_code || "",
          property_type: property.property_type || "",
          bedrooms: property.bedrooms?.toString() || "",
          bathrooms: property.bathrooms?.toString() || "",
          square_feet: property.square_feet?.toString() || "",
          lot_size: property.lot_size?.toString() || "",
          year_built: property.year_built?.toString() || "",
          listing_price: property.listing_price?.toString() || "",
          description: property.description || "",
        })
      } else {
        alert("Failed to load property")
        router.push("/dashboard/properties")
      }
    } catch (error) {
      console.error("Error fetching property:", error)
      alert("Error loading property")
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",
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

      if (response.ok) {
        router.push("/dashboard/properties")
      } else {
        alert(`Failed to update property: ${result.error}${result.details ? ` - ${result.details}` : ""}`)
      }
    } catch (error) {
      console.error("Error updating property:", error)
      alert("Error updating property. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (fetching) {
    return (
      <div className="p-6">
        <div className="text-center">Loading property...</div>
      </div>
    )
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
        <h1 className="text-2xl font-bold mt-2">Edit Property</h1>
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
                {loading ? "Updating..." : "Update Property"}
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
