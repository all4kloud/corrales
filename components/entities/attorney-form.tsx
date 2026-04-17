"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"

interface AttorneyFormProps {
  attorneyId?: string
}

export function AttorneyForm({ attorneyId }: AttorneyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [specialtyInput, setSpecialtyInput] = useState("")
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
    specialties: [] as string[],
    website: "",
    notes: "",
  })

  useEffect(() => {
    if (attorneyId) {
      fetchAttorney()
    }
  }, [attorneyId])

  const fetchAttorney = async () => {
    try {
      const response = await fetch(`/api/attorneys/${attorneyId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data.attorney)
      }
    } catch (error) {
      console.error("Error fetching attorney:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = attorneyId ? `/api/attorneys/${attorneyId}` : "/api/attorneys"
      const method = attorneyId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/dashboard/attorneys")
      } else {
        console.error("Error saving attorney")
      }
    } catch (error) {
      console.error("Error saving attorney:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      handleChange("specialties", [...formData.specialties, specialtyInput.trim()])
      setSpecialtyInput("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    handleChange(
      "specialties",
      formData.specialties.filter((s) => s !== specialty),
    )
  }

  const handleSpecialtyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSpecialty()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/attorneys">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{attorneyId ? "Edit Attorney" : "New Attorney"}</h1>
          <p className="text-muted-foreground">
            {attorneyId ? "Update attorney information" : "Add a new legal professional"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Firm Information */}
          <Card>
            <CardHeader>
              <CardTitle>Firm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firm_name">Firm Name *</Label>
                <Input
                  id="firm_name"
                  value={formData.firm_name}
                  onChange={(e) => handleChange("firm_name", e.target.value)}
                  placeholder="Smith & Associates Law Firm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attorney_name">Attorney Name</Label>
                <Input
                  id="attorney_name"
                  value={formData.attorney_name}
                  onChange={(e) => handleChange("attorney_name", e.target.value)}
                  placeholder="John Smith, Esq."
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
                    placeholder="contact@smithlaw.com"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bar_number">Bar Number</Label>
                  <Input
                    id="bar_number"
                    value={formData.bar_number}
                    onChange={(e) => handleChange("bar_number", e.target.value)}
                    placeholder="123456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://www.smithlaw.com"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="flex gap-2">
                  <Input
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyPress={handleSpecialtyKeyPress}
                    placeholder="Add specialty (e.g., Real Estate Law)"
                  />
                  <Button type="button" onClick={addSpecialty} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Los Angeles"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleChange("zip_code", e.target.value)}
                  placeholder="90210"
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
                placeholder="Add any additional notes about this attorney..."
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
            {loading ? "Saving..." : attorneyId ? "Update Attorney" : "Create Attorney"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/attorneys">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
