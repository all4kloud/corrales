"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Scale, Mail, Phone, MapPin } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Attorney {
  id: string
  firm_name: string
  attorney_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  bar_number: string
  specialties: string[]
  website: string
  notes: string
  created_at: string
}

export function AttorneysList() {
  const router = useRouter()
  const { user } = useAuth()
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; attorneyId: string } | null>(null)

  useEffect(() => {
    fetchAttorneys()
  }, [search])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const fetchAttorneys = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/attorneys?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAttorneys(data.attorneys || [])
      }
    } catch (error) {
      console.error("Error fetching attorneys:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDelete = async (attorneyId: string) => {
    if (!confirm("Are you sure you want to delete this attorney? It will be hidden from the list.")) {
      return
    }

    try {
      const response = await fetch(`/api/attorneys/${attorneyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAttorneys()
        setContextMenu(null)
      } else {
        console.error("Error deleting attorney")
      }
    } catch (error) {
      console.error("Error deleting attorney:", error)
    }
  }

  const handleView = (attorneyId: string) => {
    router.push(`/dashboard/attorneys/${attorneyId}`)
  }

  const handleEdit = (attorneyId: string) => {
    router.push(`/dashboard/attorneys/${attorneyId}/edit`)
  }

  const handleContextMenu = (e: React.MouseEvent, attorneyId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, attorneyId })
  }

  const handleCardClick = (attorneyId: string) => {
    router.push(`/dashboard/attorneys/${attorneyId}/edit`)
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading attorneys...</div>
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
              placeholder="Search attorneys by firm name or attorney name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attorneys List */}
      <Card>
        <CardHeader>
          <CardTitle>All Attorneys ({attorneys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attorneys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No attorneys found</p>
                <p className="text-sm">Add your first attorney to get started</p>
              </div>
            ) : (
              attorneys.map((attorney) => (
                <ContextMenu key={attorney.id}>
                  <ContextMenuTrigger>
                    <div
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCardClick(attorney.id)}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Scale className="h-5 w-5 text-primary" />
                          <h4 className="font-medium text-lg">{attorney.firm_name}</h4>
                          <Badge variant="outline">Attorney</Badge>
                        </div>

                        {attorney.attorney_name && (
                          <p className="text-sm text-muted-foreground">Attorney: {attorney.attorney_name}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          {attorney.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{attorney.email}</span>
                            </div>
                          )}
                          {attorney.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{attorney.phone}</span>
                            </div>
                          )}
                          {attorney.city && attorney.state && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {attorney.city}, {attorney.state}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {attorney.bar_number && <span>Bar #: {attorney.bar_number}</span>}
                          {attorney.website && (
                            <a
                              href={attorney.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                            </a>
                          )}
                        </div>

                        {attorney.specialties && attorney.specialties.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Specialties:</span>
                            <div className="flex gap-1">
                              {attorney.specialties.map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {attorney.notes && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{attorney.notes}</p>
                        )}

                        <div className="text-xs text-muted-foreground">Added on {formatDate(attorney.created_at)}</div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  {canDelete && (
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(attorney.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Attorney
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
