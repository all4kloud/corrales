"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Edit, Search, User, Mail, Phone, Building2 } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

interface UserProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
  role_name: string
  company: string
  license_number: string
  is_active: boolean
  last_login: string
  created_at: string
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles")
      if (response.ok) {
        const data = await response.json()
        setProfiles(data)
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      (profile.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (profile.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (profile.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || profile.role_name === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    if (!role) return "bg-gray-100 text-gray-800"

    switch (role.toLowerCase()) {
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

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0) || "?"
    const last = lastName?.charAt(0) || "?"
    return `${first}${last}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading profiles...</div>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">User Profiles</h1>
              <p className="text-muted-foreground">
                Manage user profiles and account information across your organization
              </p>
            </div>
          </div>
          <Link href="/dashboard/profiles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find specific user profiles quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setRoleFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Grid */}
        <div className="grid gap-4">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className={!profile.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile.first_name, profile.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {profile.first_name || "Unknown"} {profile.last_name || "User"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {profile.email || "No email"}
                        </span>
                        {profile.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {profile.phone}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(profile.role_name)}>{profile.role_name || "No Role"}</Badge>
                    <Badge variant={profile.is_active ? "default" : "secondary"}>
                      {profile.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {profile.company && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.company}</span>
                      </div>
                    )}
                    {profile.license_number && (
                      <div>
                        <span className="text-muted-foreground">License:</span> {profile.license_number}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Last Login:</span> {formatDate(profile.last_login)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span> {formatDate(profile.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/profiles/${profile.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfiles.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || roleFilter !== "all" ? "No profiles match your filters" : "No profiles found"}
              </p>
              <Link href="/dashboard/profiles/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
