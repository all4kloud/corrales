"use client"

import React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2, Loader2, Mail, Phone, User } from "lucide-react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ENTITY_TYPE_OPTIONS = [
  { value: "insurance",   label: "Insurance" },
  { value: "appraisal",  label: "Appraisal" },
  { value: "title",      label: "Title Company" },
  { value: "contractor", label: "Contractor" },
  { value: "other",      label: "Other" },
] as const

const ENTITY_TYPE_LABELS: Record<string, string> = {
  insurance:  "Insurance",
  appraisal:  "Appraisal",
  title:      "Title Company",
  contractor: "Contractor",
  other:      "Other",
}

interface Contact {
  id?: string
  contact_name: string
  email: string
  phone: string
  role: string
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

export default function OtherEntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [entity, setEntity] = useState<OtherEntity | null>(null)
  const [formData, setFormData] = useState({
    company_name: "",
    entity_type: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    website: "",
    notes: "",
  })
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    fetchEntity()
  }, [params.id])

  const fetchEntity = async () => {
    try {
      const response = await fetch(`/api/other-entities/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setEntity(data.entity)
        setFormData({
          company_name: data.entity.company_name || "",
          entity_type: data.entity.entity_type || "",
          address: data.entity.address || "",
          city: data.entity.city || "",
          state: data.entity.state || "",
          zip_code: data.entity.zip_code || "",
          website: data.entity.website || "",
          notes: data.entity.notes || "",
        })
        setContacts(
          data.entity.contacts.length > 0
            ? data.entity.contacts
            : [{ contact_name: "", email: "", phone: "", role: "", is_primary: true }]
        )
      } else {
        router.push("/dashboard/other-entities")
      }
    } catch (error) {
      console.error("Error fetching entity:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactChange = (index: number, field: keyof Contact, value: string | boolean) => {
    setContacts((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      
      if (field === "is_primary" && value === true) {
        return updated.map((c, i) => ({
          ...c,
          is_primary: i === index,
        }))
      }
      
      return updated
    })
  }

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { contact_name: "", email: "", phone: "", role: "", is_primary: false },
    ])
  }

  const removeContact = (index: number) => {
    if (contacts.length === 1) return
    setContacts((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      if (prev[index].is_primary && updated.length > 0) {
        updated[0].is_primary = true
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const validContacts = contacts.filter((c) => c.contact_name.trim())

      const response = await fetch(`/api/other-entities/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contacts: validContacts,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEntity(data.entity)
        setEditing(false)
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update entity")
      }
    } catch (error) {
      console.error("Error updating entity:", error)
      alert("An error occurred while updating the entity")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entity?")) return

    try {
      const response = await fetch(`/api/other-entities/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard/other-entities")
      } else {
        alert("Failed to delete entity")
      }
    } catch (error) {
      console.error("Error deleting entity:", error)
      alert("An error occurred while deleting the entity")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!entity) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Entity not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/other-entities">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{entity.company_name}</h1>
              {entity.entity_type && (
                <Badge variant="secondary" className="mt-1">
                  {ENTITY_TYPE_LABELS[entity.entity_type] ?? entity.entity_type}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity_type">Entity Type *</Label>
                    <Select
                      value={formData.entity_type}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, entity_type: val }))}
                    >
                      <SelectTrigger id="entity_type">
                        <SelectValue placeholder="Select entity type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contacts</CardTitle>
                  <CardDescription>Manage contacts for this entity</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {contacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Contact {index + 1}</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`primary-${index}`}
                            checked={contact.is_primary}
                            onCheckedChange={(checked) =>
                              handleContactChange(index, "is_primary", checked === true)
                            }
                          />
                          <Label htmlFor={`primary-${index}`} className="text-sm">
                            Primary
                          </Label>
                        </div>
                        {contacts.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeContact(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Contact Name</Label>
                        <Input
                          value={contact.contact_name}
                          onChange={(e) =>
                            handleContactChange(index, "contact_name", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={contact.role}
                          onChange={(e) => handleContactChange(index, "role", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, "email", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </form>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entity.address && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p>
                      {entity.address}
                      {entity.city && `, ${entity.city}`}
                      {entity.state && `, ${entity.state}`}
                      {entity.zip_code && ` ${entity.zip_code}`}
                    </p>
                  </div>
                )}
                {entity.website && (
                  <div>
                    <Label className="text-muted-foreground">Website</Label>
                    <p>
                      <a
                        href={entity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {entity.website}
                      </a>
                    </p>
                  </div>
                )}
                {entity.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="whitespace-pre-wrap">{entity.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Contacts ({entity.contacts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entity.contacts.length === 0 ? (
                  <p className="text-muted-foreground">No contacts added</p>
                ) : (
                  entity.contacts.map((contact) => (
                    <div key={contact.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{contact.contact_name}</span>
                          {contact.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        {contact.role && (
                          <span className="text-sm text-muted-foreground">{contact.role}</span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${contact.email}`} className="hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${contact.phone}`} className="hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
