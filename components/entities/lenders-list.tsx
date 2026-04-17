"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Building, Mail, Phone, MapPin } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Lender {
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
  created_at: string
}

export function LendersList() {
  const router = useRouter()
  const { user } = useAuth()
  const [lenders, setLenders] = useState<Lender[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lenderId: string } | null>(null)

  useEffect(() => {
    fetchLenders()
  }, [search])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const fetchLenders = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/lenders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLenders(data.lenders || [])
      }
    } catch (error) {
      console.error("Error fetching lenders:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDelete = async (lenderId: string) => {
    if (!confirm("Are you sure you want to delete this lender? It will be hidden from the list.")) {
      return
    }

    try {
      const response = await fetch(`/api/lenders/${lenderId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchLenders()
        setContextMenu(null)
      } else {
        console.error("Error deleting lender")
      }
    } catch (error) {
      console.error("Error deleting lender:", error)
    }
  }

  const handleView = (lenderId: string) => {
    router.push(`/dashboard/lenders/${lenderId}`)
  }

  const handleEdit = (lenderId: string) => {
    router.push(`/dashboard/lenders/${lenderId}/edit`)
  }

  const handleContextMenu = (e: React.MouseEvent, lenderId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, lenderId })
  }

  const handleCardClick = (lenderId: string) => {
    router.push(`/dashboard/lenders/${lenderId}/edit`)
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading lenders...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lenders by company name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lenders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Lenders ({lenders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lenders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No lenders found</p>
                <p className="text-sm">Add your first lender to get started</p>
              </div>
            ) : (
              lenders.map((lender) => (
                <ContextMenu key={lender.id}>
                  <ContextMenuTrigger>
                    <div
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCardClick(lender.id)}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-primary" />
                          <h4 className="font-medium text-lg">{lender.company_name}</h4>
                          <Badge variant="outline">Lender</Badge>
                        </div>

                        {lender.contact_name && (
                          <p className="text-sm text-muted-foreground">Contact: {lender.contact_name}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          {lender.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{lender.email}</span>
                            </div>
                          )}
                          {lender.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{lender.phone}</span>
                            </div>
                          )}
                          {lender.city && lender.state && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {lender.city}, {lender.state}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lender.license_number && <span>License: {lender.license_number}</span>}
                          {lender.website && (
                            <a
                              href={lender.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                            </a>
                          )}
                        </div>

                        {lender.notes && <p className="text-sm text-muted-foreground line-clamp-2">{lender.notes}</p>}

                        <div className="text-xs text-muted-foreground">Added on {formatDate(lender.created_at)}</div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  {canDelete && (
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(lender.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Lender
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
