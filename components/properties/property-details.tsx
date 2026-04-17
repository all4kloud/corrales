"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, ArrowLeft, Home, MapPin, DollarSign, Calendar, Ruler, Bed, Bath } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PropertyDetail {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  bedrooms: number
  bathrooms: number
  square_feet: number
  lot_size: number
  year_built: number
  listing_price: number
  market_value: number
  mls_number: string
  description: string
  features: string[]
  created_at: string
  updated_at: string
}

export function PropertyDetails({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`)
      if (response.ok) {
        const data = await response.json()
        setProperty(data.property)
      } else {
        router.push("/dashboard/properties")
      }
    } catch (error) {
      console.error("Error fetching property:", error)
      router.push("/dashboard/properties")
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

  const formatPropertyType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">Loading property details...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <div className="text-center">Property not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property Details</h1>
            <p className="text-muted-foreground">
              {property.address}, {property.city}, {property.state}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/properties/${property.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">{formatPropertyType(property.property_type)}</Badge>
                {property.mls_number && <Badge variant="secondary">MLS: {property.mls_number}</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {property.listing_price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Listing Price</p>
                      <p className="font-semibold">{formatCurrency(property.listing_price)}</p>
                    </div>
                  </div>
                )}
                {property.market_value && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Market Value</p>
                      <p className="font-semibold">{formatCurrency(property.market_value)}</p>
                    </div>
                  </div>
                )}
              </div>

              {property.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{property.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Property Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-semibold">{property.bedrooms}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-semibold">{property.bathrooms}</p>
                    </div>
                  </div>
                )}
                {property.square_feet && (
                  <div>
                    <p className="text-sm text-muted-foreground">Square Feet</p>
                    <p className="font-semibold">{property.square_feet.toLocaleString()}</p>
                  </div>
                )}
                {property.year_built && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                      <p className="font-semibold">{property.year_built}</p>
                    </div>
                  </div>
                )}
              </div>

              {property.lot_size && (
                <div className="mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Lot Size</p>
                    <p className="font-semibold">{property.lot_size} acres</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Features & Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{property.address}</p>
                <p className="text-muted-foreground">
                  {property.city}, {property.state} {property.zip_code}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property Type</span>
                <span className="font-medium">{formatPropertyType(property.property_type)}</span>
              </div>
              {property.bedrooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
              )}
              {property.square_feet && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Square Feet</span>
                  <span className="font-medium">{property.square_feet.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
