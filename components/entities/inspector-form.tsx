"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface InspectionType {
  id: string
  name: string
  description: string
}

interface InspectorFormProps {
  inspectorId?: string
}

export function InspectorForm({ inspectorId }: InspectorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!inspectorId)
  const [saving, setSaving] = useState(false)
  const [inspectionTypes, setInspectionTypes] = useState<InspectionType[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    license_number: "",
    website: "",
    notes: "",
  })

  useEffect(() => {
    fetchInspectionTypes()
    if (inspectorId) {
      fetchInspector()
    }
  }, [inspectorId])

  const fetchInspectionTypes = async () => {
    try {
      const response = await fetch("/api/inspection-types")
      if (response.ok) {
        const data = await response.json()
        setInspectionTypes(data.inspectionTypes || data.types || [])
      }
    } catch (error) {
      console.error("Error fetching inspection types:", error)
    }
  }

  const fetchInspector = async () => {
    try {
      const response = await fetch(`/api/inspectors/${inspectorId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          company_name: data.inspector.company_name || "",
          contact_name: data.inspector.contact_name || "",
          email: data.inspector.email || "",
          phone: data.inspector.phone || "",
          address: data.inspector.address || "",
          city: data.inspector.city || "",
          state: data.inspector.state || "",
          zip_code: data.inspector.zip || "",
          license_number: data.inspector.license_number || "",
          website: data.inspector.website || "",
          notes: data.inspector.notes || "",
        })
        // API returns specialties[].inspection_type_id — map to that field
        setSelectedTypes(
          data.inspector.specialties
            ?.map((s: any) => s.inspection_type_id)
            .filter(Boolean) || []
        )
      }
    } catch (error) {
      console.error("Error fetching inspector:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = inspectorId ? `/api/inspectors/${inspectorId}` : "/api/inspectors"
      const method = inspectorId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialty_ids: selectedTypes,
        }),
      })

      if (response.ok) {
        router.push("/dashboard/inspectors")
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to save inspector")
      }
    } catch (error) {
      console.error("Error saving inspector:", error)
      alert("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Specialties *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspectionTypes.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => toggleType(type.id)}
                />
                <Label htmlFor={type.id} className="cursor-pointer font-normal">
                  {type.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Additional notes about this inspector..."
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {inspectorId ? "Update Inspector" : "Create Inspector"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
