"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, MoreHorizontal, Search, Mail, Phone, MapPin, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface TitleCompany {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  fax: string
  website: string
  notes: string
  created_at: string
}

export function TitleCompaniesList() {
  const [titleCompanies, setTitleCompanies] = useState<TitleCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchTitleCompanies()
  }, [search])

  const fetchTitleCompanies = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)

      const response = await fetch(`/api/title-companies?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTitleCompanies(data.titleCompanies)
      }
    } catch (error) {
      console.error("Error fetching title companies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this title company?")) {
      return
    }

    try {
      const response = await fetch(`/api/title-companies/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTitleCompanies()
      }
    } catch (error) {
      console.error("Error deleting title company:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading title companies...</div>
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
              placeholder="Search title companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Title Companies List */}
      <Card>
        <CardHeader>
          <CardTitle>All Title Companies ({titleCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {titleCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No title companies found. Add your first title company to get started.
              </div>
            ) : (
              titleCompanies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-lg">{company.company_name}</h4>
                      <Badge variant="outline">Title Company</Badge>
                    </div>

                    {company.contact_name && (
                      <p className="text-sm text-muted-foreground">Contact: {company.contact_name}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      {company.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {company.city && company.state && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {company.city}, {company.state}
                          </span>
                        </div>
                      )}
                    </div>

                    {company.website && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {company.website}
                        </a>
                      </div>
                    )}

                    {company.notes && <p className="text-sm text-muted-foreground line-clamp-2">{company.notes}</p>}

                    <div className="text-xs text-muted-foreground">Added on {formatDate(company.created_at)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/entities/title-companies/${company.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/entities/title-companies/${company.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(company.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
