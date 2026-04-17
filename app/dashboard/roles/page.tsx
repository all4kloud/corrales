"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Shield, Users } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  user_count: number
  is_active: boolean
  created_at: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRole = async (id: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchRoles()
      }
    } catch (error) {
      console.error("Error deleting role:", error)
    }
  }

  const getRoleColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-purple-100 text-purple-800"
      case "agent":
        return "bg-blue-100 text-blue-800"
      case "assistant":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading roles...</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Roles & Permissions</h1>
              <p className="text-muted-foreground">Manage user roles and their access permissions across the system</p>
            </div>
          </div>
          <Link href="/dashboard/roles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Role
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {roles.map((role) => (
            <Card key={role.id} className={!role.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.name}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(role.name)}>{role.name}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {role.user_count} users
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Permissions: {role.permissions.length} assigned</div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/roles/${role.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {roles.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No roles found</p>
              <Link href="/dashboard/roles/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Role
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
