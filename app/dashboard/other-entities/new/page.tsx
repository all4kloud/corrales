"use client"

import React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ENTITY_TYPE_OPTIONS = [
  { value: "insurance",    label: "Insurance" },
  { value: "appraisal",   label: "Appraisal" },
  { value: "title",       label: "Title Company" },
  { value: "contractor",  label: "Contractor" },
  { value: "other",       label: "Other" },
] as const

interface Contact {
  contact_name: string
  email: string
  phone: string
  role: string
  is_primary: boolean
}

export default function NewOtherEntityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  const [contacts, setContacts] = useState<Contact[]>([
    { contact_name: "", email: "", phone: "", role: "", is_primary: true },
  ])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactChange = (index: number, field: keyof Contact, value: string | boolean) => {
    setContacts((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      
      // If setting is_primary to true, set others to false
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
      // If removed contact was primary, make first one primary
      if (prev[index].is_primary && updated.length > 0) {
        updated[0].is_primary = true
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Filter out empty contacts
      const validContacts = contacts.filter((c) => c.contact_name.trim())

      const response = await fetch("/api/other-entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          contacts: validContacts,
        }),
      })

      if (response.ok) {
        router.push("/dashboard/other-entities")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create entity")
      }
    } catch (error) {
      console.error("Error creating entity:", error)
      alert("An error occurred while creating the entity")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/other-entities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Add New Entity</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic information about the entity</CardDescription>
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
                    required
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
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
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
                  placeholder="https://"
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
                <CardDescription>Add one or more contacts for this entity</CardDescription>
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
                          Primary Contact
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
                      <Label>Contact Name *</Label>
                      <Input
                        value={contact.contact_name}
                        onChange={(e) => handleContactChange(index, "contact_name", e.target.value)}
                        required={index === 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input
                        value={contact.role}
                        onChange={(e) => handleContactChange(index, "role", e.target.value)}
                        placeholder="e.g., Manager, Owner, Representative"
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

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/other-entities">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Entity"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
