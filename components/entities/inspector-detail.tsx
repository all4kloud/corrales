"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Building, Mail, Phone, MapPin, FileText, Globe, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface InspectionType {
  id: string
  name: string
}

interface Inspector {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  license_number: string
  website: string
  notes: string
  specialties: InspectionType[]
  created_at: string
  updated_at: string
}

interface InspectorDetailProps {
  inspectorId: string
}

export function InspectorDetail({ inspectorId }: InspectorDetailProps) {
  const router = useRouter()
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchInspector()
  }, [inspectorId])

  const fetchInspector = async () => {
    try {
      const response = await fetch(`/api/inspectors/${inspectorId}`)
      if (response.ok) {
        const data = await response.json()
        setInspector(data.inspector)
      }
    } catch (error) {
      console.error("Error fetching inspector:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this inspector?")) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/inspectors/${inspectorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard/inspectors")
        router.refresh()
      } else {
        alert("Failed to delete inspector")
      }
    } catch (error) {
      console.error("Error deleting inspector:", error)
      alert("An error occurred")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!inspector) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Inspector not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{inspector.company_name}</h1>
          <p className="text-muted-foreground">{inspector.contact_name}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/dashboard/inspectors/${inspectorId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${inspector.email}`} className="text-primary hover:underline">
                  {inspector.email}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <a href={`tel:${inspector.phone}`} className="text-primary hover:underline">
                  {inspector.phone}
                </a>
              </div>
            </div>
            {inspector.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a
                    href={inspector.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {inspector.website}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                {inspector.address && <p>{inspector.address}</p>}
                {(inspector.city || inspector.state || inspector.zip_code) && (
                  <p>
                    {inspector.city}
                    {inspector.city && inspector.state && ", "}
                    {inspector.state} {inspector.zip_code}
                  </p>
                )}
                {!inspector.address && !inspector.city && !inspector.state && (
                  <p className="text-muted-foreground">No address provided</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Specialties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {inspector.specialties && inspector.specialties.length > 0 ? (
              inspector.specialties.map((specialty) => (
                <Badge key={specialty.id} variant="secondary">
                  {specialty.name}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground">No specialties assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {inspector.license_number && (
        <Card>
          <CardHeader>
            <CardTitle>Licensing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">License Number</p>
                <p className="font-medium">{inspector.license_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {inspector.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{inspector.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
