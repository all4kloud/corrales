"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, Users, Mail, Phone, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

interface Contact {
  id: string
  contact_name: string
  email: string | null
  phone: string | null
  role: string | null
  is_primary: boolean
}

interface OtherEntity {
  id: string
  company_name: string
  entity_type: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  website: string | null
  notes: string | null
  contacts: Contact[]
}

export default function OtherEntitiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [entities, setEntities] = useState<OtherEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchEntities()
  }, [])

  const fetchEntities = async () => {
    try {
      const response = await fetch("/api/other-entities")
      if (response.ok) {
        const data = await response.json()
        setEntities(data.entities)
      }
    } catch (error) {
      console.error("Error fetching entities:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEntities = entities.filter(
    (entity) =>
      entity.company_name.toLowerCase().includes(search.toLowerCase()) ||
      entity.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      entity.contacts.some(
        (c) =>
          c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase())
      )
  )

  return (
    <DashboardLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Other Entities</h1>
            <Button asChild>
              <Link href="/dashboard/other-entities/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Entity
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entities..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {search
                    ? "No entities match your search."
                    : "No entities found. Add your first entity to get started."}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEntities.map((entity) => {
                    const primaryContact = entity.contacts.find((c) => c.is_primary) || entity.contacts[0]
                    return (
                      <Card
                        key={entity.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/dashboard/other-entities/${entity.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <Building2 className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{entity.company_name}</h3>
                              {entity.entity_type && (
                                <Badge variant="secondary" className="mt-1">
                                  {entity.entity_type}
                                </Badge>
                              )}
                              
                              {/* Contacts count */}
                              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>{entity.contacts.length} contact{entity.contacts.length !== 1 ? "s" : ""}</span>
                              </div>

                              {/* Primary contact info */}
                              {primaryContact && (
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="font-medium text-foreground">{primaryContact.contact_name}</div>
                                  {primaryContact.email && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{primaryContact.email}</span>
                                    </div>
                                  )}
                                  {primaryContact.phone && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span>{primaryContact.phone}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Suspense>
    </DashboardLayout>
  )
}
