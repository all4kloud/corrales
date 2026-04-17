"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Settings, User, Bell, Database, FolderSync, AlertCircle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    taskReminders: true,
    weeklyReports: true,
    autoFollowUp: true,
    dataRetention: "12", // months
    timezone: "America/New_York",
  })
  
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{
    total?: number
    migrated?: number
    errors?: number
    message?: string
    details?: string
    action?: string
    errorDetails?: Array<{ documentId: string; error: string }>
  } | null>(null)

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    license: "",
  })

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        license: user.license || "",
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        // Show success message
        console.log("Profile updated successfully")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        // Show success message
        console.log("Settings updated successfully")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  const handleMigrateDocuments = async () => {
    if (!confirm("This will reorganize all existing documents into transaction-specific folders in Google Drive. Continue?")) {
      return
    }

    setMigrationLoading(true)
    setMigrationResult(null)

    try {
      const response = await fetch("/api/documents/migrate", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setMigrationResult(data)
      } else {
        setMigrationResult({
          message: data.error || "Migration failed",
          details: data.details,
          action: data.action,
        })
      }
    } catch (error) {
      console.error("Error migrating documents:", error)
      setMigrationResult({
        message: "Failed to migrate documents. Please try again.",
      })
    } finally {
      setMigrationLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const response = await fetch("/api/documents/migration-report")
      const data = await response.json()

      if (response.ok && data.documents) {
        // Convert to CSV
        const headers = ["Document Name", "Property Address", "Transaction Type", "Upload Date", "Issue", "Google Drive URL"]
        const csvRows = [
          headers.join(","),
          ...data.documents.map((doc: any) =>
            [
              `"${doc.documentName}"`,
              `"${doc.propertyAddress}"`,
              doc.transactionType,
              doc.uploadedDate,
              `"${doc.issue}"`,
              doc.googleDriveUrl,
            ].join(",")
          ),
        ]
        const csvContent = csvRows.join("\n")

        // Download CSV
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `migration-report-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert("Failed to generate report")
      }
    } catch (error) {
      console.error("Error downloading report:", error)
      alert("Failed to download report")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal and professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={profile.license}
                  onChange={(e) => setProfile({ ...profile, license: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications and reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive urgent updates via SMS</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get reminders for upcoming tasks</p>
                </div>
                <Switch
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) => setSettings({ ...settings, taskReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Follow-up</Label>
                  <p className="text-sm text-muted-foreground">Automatically create follow-up tasks</p>
                </div>
                <Switch
                  checked={settings.autoFollowUp}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoFollowUp: checked })}
                />
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Current system status and user role information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>User Role</Label>
                <Badge variant="secondary" className="text-sm">
                  {user?.role || "User"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <Badge variant="default" className="text-sm bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Last Login</Label>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Migration (Admin Only) */}
        {user?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderSync className="h-5 w-5" />
                Document Migration
              </CardTitle>
              <CardDescription>
                Reorganize existing documents into transaction-specific folders in Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>One-time migration</AlertTitle>
                <AlertDescription>
                  This will move all existing documents to their respective transaction folders. New documents are
                  already organized automatically. This process may take a few minutes depending on the number of
                  documents.
                </AlertDescription>
              </Alert>

              {migrationResult && (
                <Alert variant={migrationResult.errors || migrationResult.details ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{migrationResult.message}</AlertTitle>
                  <AlertDescription className="space-y-2">
                    {migrationResult.total !== undefined && (
                      <div>
                        Total: {migrationResult.total} | Migrated: {migrationResult.migrated} | Errors:{" "}
                        {migrationResult.errors}
                      </div>
                    )}
                    {migrationResult.details && (
                      <div className="text-sm font-medium">
                        {migrationResult.details}
                      </div>
                    )}
                    {migrationResult.errorDetails && migrationResult.errorDetails.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-1">
                        <div className="text-sm font-semibold">First {Math.min(5, migrationResult.errorDetails.length)} errors:</div>
                        {migrationResult.errorDetails.slice(0, 5).map((err, idx) => (
                          <div key={idx} className="text-xs font-mono bg-red-50 p-2 rounded">
                            Doc: {err.documentId.slice(0, 8)}... - {err.error}
                          </div>
                        ))}
                        {migrationResult.errorDetails.length > 5 && (
                          <div className="text-xs italic">...and {migrationResult.errorDetails.length - 5} more errors</div>
                        )}
                      </div>
                    )}
                    {migrationResult.action && (
                      <div className="text-sm font-semibold pt-2 border-t">
                        ➜ {migrationResult.action}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button onClick={handleMigrateDocuments} disabled={migrationLoading} className="flex-1">
                  {migrationLoading ? "Migrating Documents..." : "Start Migration"}
                </Button>
                <Button onClick={handleDownloadReport} variant="outline" className="flex-1 bg-transparent">
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
