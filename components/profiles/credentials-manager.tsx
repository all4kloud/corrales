"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Copy, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CredentialsManagerProps {
  userId: string
  userEmail: string
}

export function CredentialsManager({ userId, userEmail }: CredentialsManagerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleResetPassword = async () => {
    try {
      setLoading(true)
      setError(null)
      setNewPassword(null)

      const response = await fetch(`/api/profiles/${userId}/reset-password`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.details || data.error || "Failed to reset password")
      }

      const data = await response.json()
      setNewPassword(data.temporaryPassword)

      toast({
        title: "Password Reset Successful",
        description: "A new temporary password has been generated.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!newPassword) return

    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the password manually",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="h-4 w-4 mr-2" />
          Manage Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Credentials</DialogTitle>
          <DialogDescription>View login information or reset the password for this user</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Login Email</Label>
            <Input id="email" value={userEmail} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            {newPassword ? (
              <div className="space-y-2">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    New temporary password generated successfully!
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Input value={newPassword} readOnly className="font-mono" />
                  <Button size="icon" variant="outline" onClick={copyToClipboard}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy this password and share it securely with the user. They should change it after first login.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Passwords are encrypted and cannot be displayed. You can reset the password to generate a new temporary
                one.
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error: {error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handleResetPassword} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
