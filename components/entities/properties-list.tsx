"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Search, Home, Bed, Bath, Square } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Property {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  listing_price: number
  mls_number: string
  created_at: string
}

export function PropertiesList() {
  const router = useRouter()
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [propertyType, setPropertyType] = useState("all")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; propertyId: string } | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [search, propertyType])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const fetchProperties = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (propertyType !== "all") params.append("property_type", propertyType)

      const response = await fetch(`/api/properties?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property? It will be hidden from the list.")) {
      return
    }

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchProperties()
        setContextMenu(null)
      } else {
        console.error("Error deleting property")
      }
    } catch (error) {
      console.error("Error deleting property:", error)
    }
  }

  const handleView = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}`)
  }

  const handleEdit = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}/edit`)
  }

  const handleContextMenu = (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, propertyId })
  }

  const handleCardClick = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}/edit`)
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading properties...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Single Family">Single Family</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                  <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>All Properties ({properties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No properties found. Add your first property to get started.
              </div>
            ) : (
              properties.map((property) => (
                <ContextMenu key={property.id}>
                  <ContextMenuTrigger>
                    <div
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCardClick(property.id)}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Home className="h-5 w-5 text-primary" />
                          <h4 className="font-medium text-lg">{property.address}</h4>
                          {property.property_type && <Badge variant="outline">{property.property_type}</Badge>}
                        </div>

                        <p className="text-muted-foreground">
                          {property.city}, {property.state} {property.zip_code}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          {property.bedrooms && (
                            <div className="flex items-center gap-1">
                              <Bed className="h-4 w-4" />
                              <span>{property.bedrooms} bed</span>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div className="flex items-center gap-1">
                              <Bath className="h-4 w-4" />
                              <span>{property.bathrooms} bath</span>
                            </div>
                          )}
                          {property.square_feet && (
                            <div className="flex items-center gap-1">
                              <Square className="h-4 w-4" />
                              <span>{property.square_feet.toLocaleString()} sqft</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {property.listing_price && (
                              <span className="font-semibold text-lg text-primary">
                                {formatCurrency(property.listing_price)}
                              </span>
                            )}
                            {property.mls_number && (
                              <span className="text-sm text-muted-foreground">MLS: {property.mls_number}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">Added {formatDate(property.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  {canDelete && (
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(property.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Property
                      </ContextMenuItem>
                    </ContextMenuContent>
                  )}
                </ContextMenu>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
