"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Mail, Phone, MapPin, ShieldCheck } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Client {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  notes: string
  created_at: string
  portal_access_enabled?: boolean
}

export function ClientsList() {
  const router = useRouter()
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clientId: string } | null>(null)

  useEffect(() => {
    fetchClients()
  }, [search])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/clients?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client? It will be hidden from the list.")) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchClients()
        setContextMenu(null)
      } else {
        console.error("Error deleting client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
    }
  }

  const handleView = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const handleEdit = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}/edit`)
  }

  const handleContextMenu = (e: React.MouseEvent, clientId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, clientId })
  }

  const handleCardClick = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}/edit`)
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading clients...</div>
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
              placeholder="Search clients by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No clients found. Add your first client to get started.
              </div>
            ) : (
              clients.map((client) => (
                <ContextMenu key={client.id}>
                  <ContextMenuTrigger>
                    <div
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleCardClick(client.id)}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-lg">
                            {client.first_name} {client.middle_name ? `${client.middle_name} ` : ""}
                            {client.last_name}
                          </h4>
                          <Badge variant="outline">Client</Badge>
                          {client.portal_access_enabled && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Portal
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.city && client.state && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {client.city}, {client.state}
                              </span>
                            </div>
                          )}
                        </div>

                        {client.notes && <p className="text-sm text-muted-foreground line-clamp-2">{client.notes}</p>}

                        <div className="text-xs text-muted-foreground">Added on {formatDate(client.created_at)}</div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  {canDelete && (
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Client
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
