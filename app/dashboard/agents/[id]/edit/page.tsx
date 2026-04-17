"use client"

import type React from "react"
import { use } from "react"
import { AgentCredentialsManager } from "@/components/agents/agent-credentials-manager"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ShieldCheck, KeyRound, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    license_number: "",
    brokerage: "",
    specialties: "",
    commission_rate: "",
    status: "active",
    bio: "",
    enable_portal_access: false,
  })
  
  const [hasExistingPortalAccess, setHasExistingPortalAccess] = useState(false)
  const [portalEmail, setPortalEmail] = useState("")
  const [portalCredentials, setPortalCredentials] = useState<{
    email: string
    temporary_password: string
    login_url: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchAgent()
  }, [id])

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${id}`)
      if (response.ok) {
        const data = await response.json()
        const agent = data.agent

        const hasPortal = agent.portal_access_enabled || false
        setHasExistingPortalAccess(hasPortal)
        setPortalEmail(agent.portal_email || "")
        
        setFormData({
          first_name: agent.first_name || "",
          middle_name: agent.middle_name || "",
          last_name: agent.last_name || "",
          email: agent.email || "",
          phone: agent.phone || "",
          license_number: agent.license_number || "",
          brokerage: agent.brokerage || "",
          specialties: Array.isArray(agent.specialties) ? agent.specialties.join(", ") : agent.specialties || "",
          commission_rate: agent.commission_rate ? (agent.commission_rate * 100).toString() : "",
          status: agent.status || "active",
          bio: agent.bio || "",
          enable_portal_access: hasPortal,
        })
      } else {
        console.error("Failed to fetch agent")
        router.push("/dashboard/agents")
      }
    } catch (error) {
      console.error("Error fetching agent:", error)
      router.push("/dashboard/agents")
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData = {
        license_number: formData.license_number,
        brokerage: formData.brokerage,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) / 100 : null,
        specialties: formData.specialties,
        bio: formData.bio,
        portal_access_enabled: formData.enable_portal_access,
      }

      const response = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.portal_credentials) {
          setPortalCredentials(data.portal_credentials)
        } else {
          router.push("/dashboard/agents")
        }
      } else {
        const error = await response.json()
        console.error("Failed to update agent:", error)
        alert("Failed to update agent. Please try again.")
      }
    } catch (error) {
      console.error("Error updating agent:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const copyCredentials = () => {
    if (!portalCredentials) return
    const text = `Portal Access Credentials\nEmail: ${portalCredentials.email}\nTemporary Password: ${portalCredentials.temporary_password}\nLogin URL: ${window.location.origin}${portalCredentials.login_url}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (fetching) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl">
          <CardContent className="p-6">
            <div className="text-center">Loading agent data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (portalCredentials) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Agent Updated Successfully</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Portal Access Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Important: Save these credentials</AlertTitle>
              <AlertDescription>
                These credentials will only be shown once. Please save them or send them to the agent.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-3 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-semibold">{portalCredentials.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Temporary Password:</span>{" "}
                <span className="font-semibold">{portalCredentials.temporary_password}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Login URL:</span>{" "}
                <span className="font-semibold">
                  {window.location.origin}
                  {portalCredentials.login_url}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={copyCredentials} variant="outline">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy Credentials"}
              </Button>
              <Button onClick={() => router.push("/dashboard/agents")}>Go to Agents List</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/agents"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Agent</h1>
      </div>

      {hasExistingPortalAccess && (
        <div className="mb-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Portal Access Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Agent Portal Credentials</p>
                  <p className="text-sm text-muted-foreground">
                    View login information or reset the password for this agent's portal access
                  </p>
                </div>
                <AgentCredentialsManager
                  agentId={id}
                  agentEmail={formData.email}
                  portalEmail={portalEmail}
                  hasPortalAccess={hasExistingPortalAccess}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name fields in 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => handleChange("middle_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Other fields in 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number *</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleChange("license_number", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brokerage">Brokerage</Label>
                <Input
                  id="brokerage"
                  value={formData.brokerage}
                  onChange={(e) => handleChange("brokerage", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => handleChange("commission_rate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={(e) => handleChange("specialties", e.target.value)}
                placeholder="e.g., Luxury Homes, First-Time Buyers, Commercial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={4}
                placeholder="Brief professional biography..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Agent"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Portal Access Section */}
      <Card className="max-w-4xl mt-6">
        <CardHeader>
          <CardTitle>Portal Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable_portal_access"
                  checked={formData.enable_portal_access}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, enable_portal_access: checked === true }))
                  }
                />
                <Label htmlFor="enable_portal_access" className="font-medium cursor-pointer">
                  Enable Portal Access
                </Label>
              </div>
              {hasExistingPortalAccess && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Active
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Allow this agent to access the customer portal and view their assigned transactions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
