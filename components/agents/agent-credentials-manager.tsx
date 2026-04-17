"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { KeyRound, Copy, Check, RotateCcw, ShieldCheck, AlertCircle } from "lucide-react"

interface AgentCredentialsManagerProps {
  agentId: string
  agentEmail: string
  portalEmail: string
  hasPortalAccess: boolean
}

export function AgentCredentialsManager({
  agentId,
  agentEmail,
  portalEmail,
  hasPortalAccess,
}: AgentCredentialsManagerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<{
    email: string
    temporary_password: string
    login_url: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agents/${agentId}/reset-portal-password`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to reset password")
      }
    } catch (err) {
      setError("An error occurred while resetting the password")
      console.error("Error resetting password:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    if (credentials) {
      const text = `Portal Login Credentials\n\nEmail: ${credentials.email}\nTemporary Password: ${credentials.temporary_password}\nLogin URL: ${window.location.origin}${credentials.login_url}\n\nPlease change your password after first login.`
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setCredentials(null)
    setError(null)
    setCopied(false)
  }

  if (!hasPortalAccess) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        No Portal Access
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <KeyRound className="h-4 w-4" />
          Manage Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Portal Access Credentials
          </DialogTitle>
          <DialogDescription>View login information or reset the password for this agent</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!credentials ? (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">Portal Login Email</p>
                    <p className="text-sm text-muted-foreground font-mono">{portalEmail || agentEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 mt-4">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Passwords are encrypted and cannot be displayed. You can reset the password to generate a new
                      temporary one.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button onClick={handleResetPassword} disabled={loading} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert>
                <AlertTitle>Password Reset Successful</AlertTitle>
                <AlertDescription>
                  A new temporary password has been generated. Share these credentials with the agent securely.
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3 font-mono text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-semibold">{credentials.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Temporary Password:</span>{" "}
                  <span className="font-semibold">{credentials.temporary_password}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Login URL:</span>{" "}
                  <span className="font-semibold">
                    {window.location.origin}
                    {credentials.login_url}
                  </span>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  The agent should change this temporary password after their first login.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={copyCredentials} variant="outline" className="gap-2 bg-transparent">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Credentials"}
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
