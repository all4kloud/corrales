"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  FileText,
  Download,
  Trash2,
  MoreHorizontal,
  Plus,
  Eye,
  ExternalLink,
  Loader2,
  UploadCloud,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  name: string
  file_type: string
  file_size: number
  google_drive_id: string
  google_drive_url: string
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
  task_id?: string
  document_type_id?: number
  document_type_name?: string
}

interface DocumentType {
  id: number
  name: string
  description: string
}

interface DocumentManagerProps {
  taskId?: string
  transactionId?: string
  transactionStatus?: string
}

export function DocumentManager({ taskId, transactionId, transactionStatus }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [fixingPermissions, setFixingPermissions] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("")
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { user } = useAuth()

  const checkGoogleDriveConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/google-drive/status")
      if (response.ok) {
        const data = await response.json()
        setGoogleDriveConnected(data.connected)
        return data.connected
      }
    } catch (error) {
      console.error("Error checking Google Drive connection:", error)
    }
    return false
  }, [])

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/document-types")
      if (response.ok) {
        const data = await response.json()
        setDocumentTypes(data.documentTypes || [])
      }
    } catch (error) {
      console.error("Error fetching document types:", error)
    }
  }, [])

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (taskId) params.append("task_id", taskId)
      if (transactionId) params.append("transaction_id", transactionId)

      const response = await fetch(`/api/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }, [taskId, transactionId])

  useEffect(() => {
    fetchDocuments()
    fetchDocumentTypes()
    checkGoogleDriveConnection()
  }, [fetchDocuments, fetchDocumentTypes, checkGoogleDriveConnection])

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "google-drive-connected" && event.data?.success) {
        setConnecting(false)
        setGoogleDriveConnected(true)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      // Get upload token and folder from server
      const tokenResponse = await fetch("/api/documents/upload-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to get upload token")
      }

      const { accessToken, folderId } = await tokenResponse.json()

      // Upload files directly to Google Drive
      for (const file of selectedFiles) {
        console.log(`[v0] Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) directly to Google Drive...`)

        // Create metadata
        const metadata = {
          name: file.name,
          parents: [folderId],
        }

        // Use multipart upload for Google Drive
        const form = new FormData()
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
        form.append("file", file)

        const driveResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: form,
        })

        if (!driveResponse.ok) {
          const error = await driveResponse.json()
          console.error(`[v0] Drive upload failed for ${file.name}:`, error)
          throw new Error(`Failed to upload ${file.name} to Google Drive`)
        }

        const driveFile = await driveResponse.json()

        // Set file as publicly readable via server (uses service credentials)
        let webViewLink = `https://drive.google.com/file/d/${driveFile.id}/view`
        try {
          const permResponse = await fetch("/api/documents/set-public", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId: driveFile.id }),
          })
          if (permResponse.ok) {
            const permData = await permResponse.json()
            if (permData.webViewLink) webViewLink = permData.webViewLink
          }
        } catch (permError) {
          console.error(`[v0] Warning: could not set public permission for ${file.name}:`, permError)
        }

        // Register the document in database
        const registerData = {
          name: file.name,
          file_type: file.type,
          file_size: file.size,
          google_drive_id: driveFile.id,
          google_drive_url: webViewLink,
          task_id: taskId || null,
          transaction_id: transactionId || null,
          document_type_id: selectedDocumentType ? parseInt(selectedDocumentType) : null,
        }

        const registerResponse = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        })

        if (!registerResponse.ok) {
          console.error(`[v0] Failed to register document ${file.name} in database`)
        }
      }

      setUploadModalOpen(false)
      setSelectedFiles([])
      setSelectedDocumentType("")
      fetchDocuments()
    } catch (error) {
      console.error("[v0] Error uploading documents:", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const handleGoogleDriveAuth = async () => {
    try {
      setConnecting(true)
      const response = await fetch("/api/google-drive/auth")
      if (response.ok) {
        const data = await response.json()

        const width = 500
        const height = 600
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        const popup = window.open(
          data.authUrl,
          "google-drive-auth",
          `width=${width},height=${height},left=${left},top=${top},popup=yes`,
        )

        let pollCount = 0
        const maxPolls = 150

        const pollAuth = setInterval(async () => {
          pollCount++

          if (popup?.closed) {
            clearInterval(pollAuth)
            const connected = await checkGoogleDriveConnection()
            if (!connected) {
              setConnecting(false)
            }
            return
          }

          const connected = await checkGoogleDriveConnection()
          if (connected) {
            clearInterval(pollAuth)
            setConnecting(false)
            if (popup && !popup.closed) {
              popup.close()
            }
            return
          }

          if (pollCount >= maxPolls) {
            clearInterval(pollAuth)
            setConnecting(false)
          }
        }, 2000)
      } else {
        setConnecting(false)
      }
    } catch (error) {
      console.error("Error initiating Google Drive auth:", error)
      setConnecting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = date.getFullYear()
    return `${month}-${day}-${year}`
  }

  if (!googleDriveConnected && user?.role === "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Google Drive Not Connected</h3>
          <p className="text-muted-foreground mb-4">
            Connect your Google Drive account to enable document storage and management.
          </p>
          <Button onClick={handleGoogleDriveAuth} disabled={connecting}>
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Google Drive
              </>
            )}
          </Button>
          {connecting && (
            <p className="text-sm text-muted-foreground mt-4">Complete the authorization in the popup window...</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!googleDriveConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>
            Document management is not available. Please contact your administrator to set up Google Drive integration.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleFixPermissions = async () => {
    setFixingPermissions(true)
    try {
      const response = await fetch("/api/documents/fix-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: transactionId || null }),
      })
      const data = await response.json()
      if (response.ok) {
        await fetchDocuments()
        alert(data.message)
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert("Failed to fix permissions")
    } finally {
      setFixingPermissions(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFixPermissions}
              disabled={fixingPermissions}
              title="Fix Google Drive permissions so documents are viewable"
            >
              {fixingPermissions ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Fix Permissions
            </Button>
          )}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <UploadCloud
                  className={cn("h-12 w-12 mx-auto mb-4", isDragging ? "text-primary" : "text-muted-foreground")}
                />
                <p className="text-sm font-medium mb-1">
                  {isDragging ? "Drop files here" : "Drag and drop files here"}
                </p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({selectedFiles.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploading}
                  className="min-w-[100px]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadModalOpen(false)
                    setSelectedFiles([])
                    setSelectedDocumentType("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{document.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      {document.document_type_name && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {document.document_type_name}
                          </Badge>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded by {document.uploaded_by_name}</span>
                      <span>•</span>
                      <span>{formatDate(document.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={document.google_drive_url} target="_blank" rel="noopener noreferrer" title="View document">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    asChild
                    title="Download"
                  >
                    <a href={`/api/documents/${document.id}/download`} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>

                  {transactionStatus !== "closed" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive" 
                      onClick={() => handleDelete(document.id)}
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
