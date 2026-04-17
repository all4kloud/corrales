"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Building, Mail, Phone, MapPin, ClipboardCheck } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"

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
  specialty_count: number
  created_at: string
}

export function InspectorsList() {
  const router = useRouter()
  const [inspectors, setInspectors] = useState<Inspector[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchInspectors()
  }, [search])

  const fetchInspectors = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/inspectors?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInspectors(data.inspectors || [])
      }
    } catch (error) {
      console.error("Error fetching inspectors:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDelete = async (inspectorId: string) => {
    if (!confirm("Are you sure you want to delete this inspector? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/inspectors/${inspectorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchInspectors()
      } else {
        console.error("Error deleting inspector")
      }
    } catch (error) {
      console.error("Error deleting inspector:", error)
    }
  }

  const handleView = (inspectorId: string) => {
    router.push(`/dashboard/inspectors/${inspectorId}`)
  }

  const handleEdit = (inspectorId: string) => {
    router.push(`/dashboard/inspectors/${inspectorId}/edit`)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inspectors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inspectors.map((inspector) => (
          <ContextMenu key={inspector.id}>
            <ContextMenuTrigger>
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleView(inspector.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      <span>{inspector.company_name}</span>
                    </div>
                  </CardTitle>
                  {inspector.specialty_count > 0 && (
                    <Badge variant="secondary" className="w-fit">
                      {inspector.specialty_count} specialties
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{inspector.contact_name}</span>
                    </div>
                    {inspector.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{inspector.email}</span>
                      </div>
                    )}
                    {inspector.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{inspector.phone}</span>
                      </div>
                    )}
                    {inspector.city && inspector.state && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {inspector.city}, {inspector.state}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Added {formatDate(inspector.created_at)}
                  </div>
                </CardContent>
              </Card>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleView(inspector.id)}>View Details</ContextMenuItem>
              <ContextMenuItem onClick={() => handleEdit(inspector.id)}>Edit</ContextMenuItem>
              <ContextMenuItem onClick={() => handleDelete(inspector.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      {inspectors.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {search ? "No inspectors found matching your search." : "No inspectors added yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
