"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Profile edit error boundary caught:", error)
  }, [error])

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Failed to Load Profile</CardTitle>
          </div>
          <CardDescription>
            There was an error loading the profile editor. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-mono text-muted-foreground">{error.message || "An unexpected error occurred"}</p>
            {error.digest && <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
