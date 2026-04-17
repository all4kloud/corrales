"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Search, Mail, Phone, Award, ShieldCheck } from "lucide-react"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function AgentsList() {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; agentId: string } | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [search])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const fetchAgents = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/agents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? It will be hidden from the list.")) {
      return
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAgents()
        setContextMenu(null)
      } else {
        console.error("Error deleting agent")
      }
    } catch (error) {
      console.error("Error deleting agent:", error)
    }
  }

  const handleView = (agentId: string) => {
    router.push(`/dashboard/agents/${agentId}`)
  }

  const handleEdit = (agentId: string) => {
    router.push(`/dashboard/agents/${agentId}/edit`)
  }

  const handleContextMenu = (e: React.MouseEvent, agentId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, agentId })
  }

  const handleCardClick = (agentId: string) => {
    router.push(`/dashboard/agents/${agentId}/edit`)
  }

  const canDelete = user?.role === "admin" || user?.role === "manager"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading agents...</div>
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
              placeholder="Search agents by name or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agents List */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <ContextMenu key={agent.id}>
                <ContextMenuTrigger>
                  <div
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleCardClick(agent.id)}
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-lg">
                          {agent.first_name} {agent.middle_name ? `${agent.middle_name} ` : ""}
                          {agent.last_name}
                        </h4>
                        <Badge variant="outline">Agent</Badge>
                        {agent.portal_access_enabled && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Portal
                          </Badge>
                        )}
                        <Badge className="bg-green-100 text-green-800">{agent.active_transactions} Active</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{agent.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{agent.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>License: {agent.license_number}</span>
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium">Commission:</span> {formatPercentage(agent.commission_rate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <span className="font-medium">Brokerage:</span> {agent.brokerage}
                        </span>
                      </div>

                      {agent.specialties && agent.specialties.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Specialties:</span>
                          <div className="flex gap-1">
                            {agent.specialties.map((specialty, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ContextMenuTrigger>
                {canDelete && (
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Agent
                    </ContextMenuItem>
                  </ContextMenuContent>
                )}
              </ContextMenu>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
