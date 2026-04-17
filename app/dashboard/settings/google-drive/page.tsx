"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FolderOpen, Loader2, CheckCircle2, XCircle, Link2Off, Link2, AlertTriangle } from "lucide-react"

interface Folder {
  id: string
  name: string
}

export default function GoogleDriveSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null)
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchGoogleDriveStatus()
  }, [])

  const fetchGoogleDriveStatus = async () => {
    try {
      const response = await fetch("/api/google-drive/folders")
      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected)
        setFolders(data.folders || [])
        setCurrentFolder(data.currentFolder)
        setSelectedFolder(data.currentFolder?.id || "")
      }
    } catch (error) {
      console.error("Error fetching Google Drive status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    setMessage(null)
    try {
      const response = await fetch("/api/google-drive/auth")
      if (response.ok) {
        const data = await response.json()
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        setMessage({ type: "error", text: "Failed to initiate Google Drive connection" })
      }
    } catch (error) {
      console.error("Error connecting to Google Drive:", error)
      setMessage({ type: "error", text: "An error occurred while connecting" })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Drive? This will remove the connection but won't delete any files already uploaded.")) {
      return
    }

    setDisconnecting(true)
    setMessage(null)
    try {
      const response = await fetch("/api/google-drive/disconnect", {
        method: "POST",
      })

      if (response.ok) {
        setConnected(false)
        setFolders([])
        setCurrentFolder(null)
        setSelectedFolder("")
        setMessage({ type: "success", text: "Google Drive disconnected successfully. You can now connect a different account." })
      } else {
        setMessage({ type: "error", text: "Failed to disconnect Google Drive" })
      }
    } catch (error) {
      console.error("Error disconnecting Google Drive:", error)
      setMessage({ type: "error", text: "An error occurred while disconnecting" })
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSaveFolder = async () => {
    if (!selectedFolder) return

    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch("/api/google-drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selectedFolder }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentFolder(data.folder)
        setMessage({ type: "success", text: "Google Drive folder updated successfully!" })
      } else {
        setMessage({ type: "error", text: "Failed to update folder configuration" })
      }
    } catch (error) {
      console.error("Error saving folder:", error)
      setMessage({ type: "error", text: "An error occurred while saving" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Google Drive Settings</h1>
        <p className="text-muted-foreground mb-8">Configure where documents are stored in Google Drive</p>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Connection Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Manage your Google Drive connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {connected ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </div>

              {connected ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDisconnect} 
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Link2Off className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleConnect} 
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect Google Drive
                    </>
                  )}
                </Button>
              )}
            </div>

            {connected && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  To change the connected Google Drive account, first disconnect the current account, 
                  then connect with a different Google account.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Folder Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Document Storage Folder
            </CardTitle>
            <CardDescription>
              Select the Google Drive folder where all uploaded documents will be stored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {connected ? (
              <>
                {currentFolder && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Current Folder:</p>
                    <p className="text-sm text-muted-foreground">{currentFolder.name}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="folder-select">Select Folder</Label>
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger id="folder-select">
                      <SelectValue placeholder="Choose a folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">Root (My Drive)</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Documents will be uploaded to this folder. If no folder is selected, files will be saved in the root
                    of My Drive.
                  </p>
                </div>

                <Button onClick={handleSaveFolder} disabled={saving || !selectedFolder}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Google Drive is not connected. Please connect your Google Drive account first to configure the storage
                  folder.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
