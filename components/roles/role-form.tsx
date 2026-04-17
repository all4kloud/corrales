"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface RoleFormProps {
  role?: {
    id: string
    name: string
    description: string
    permissions: string[]
    is_active: boolean
  }
  onSuccess?: () => void
}

const AVAILABLE_PERMISSIONS = [
  { id: "manage_users", label: "Manage Users", description: "Create, edit, and delete user accounts" },
  { id: "manage_roles", label: "Manage Roles", description: "Create and modify user roles and permissions" },
  { id: "manage_transactions", label: "Manage Transactions", description: "Full access to transaction management" },
  { id: "view_transactions", label: "View Transactions", description: "Read-only access to transactions" },
  { id: "manage_properties", label: "Manage Properties", description: "Create and edit property listings" },
  { id: "view_properties", label: "View Properties", description: "Read-only access to properties" },
  { id: "manage_clients", label: "Manage Clients", description: "Create and edit client information" },
  { id: "view_clients", label: "View Clients", description: "Read-only access to client information" },
  { id: "manage_agents", label: "Manage Agents", description: "Create and edit agent profiles" },
  { id: "manage_entities", label: "Manage Entities", description: "Manage lenders, attorneys, and other entities" },
  { id: "manage_follow_ups", label: "Manage Follow-ups", description: "Create and manage follow-up tasks" },
  { id: "manage_templates", label: "Manage Templates", description: "Create and edit follow-up templates" },
  { id: "view_reports", label: "View Reports", description: "Access to reporting and analytics" },
  { id: "manage_settings", label: "Manage Settings", description: "System configuration and settings" },
]

export function RoleForm({ role, onSuccess }: RoleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || "",
    permissions: role?.permissions || [],
    is_active: role?.is_active ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = role ? `/api/roles/${role.id}` : "/api/roles"
      const method = role ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save role")
      }

      toast.success(role ? "Role updated successfully" : "Role created successfully")
      onSuccess?.()
      if (!onSuccess) {
        router.push("/dashboard/roles")
      }
    } catch (error) {
      toast.error("Failed to save role")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permissionId] : prev.permissions.filter((p) => p !== permissionId),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>Basic information about the role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter role name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the role and its responsibilities"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active Role</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Select the permissions for this role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={permission.id}
                  checked={formData.permissions.includes(permission.id)}
                  onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor={permission.id} className="text-sm font-medium">
                    {permission.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>

          {formData.permissions.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Selected Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {formData.permissions.map((permissionId) => {
                  const permission = AVAILABLE_PERMISSIONS.find((p) => p.id === permissionId)
                  return (
                    <Badge key={permissionId} variant="secondary">
                      {permission?.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
        </Button>
      </div>
    </form>
  )
}
