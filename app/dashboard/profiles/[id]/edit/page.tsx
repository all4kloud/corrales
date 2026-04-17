"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProfileForm } from "@/components/profiles/profile-form"
import { CredentialsManager } from "@/components/profiles/credentials-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Profile {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  phone: string | null
  company: string | null
  license_number: string | null
  role_id: string | null
  is_active: boolean
}

interface Role {
  id: string
  name: string
}

export default function EditProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [profileRes, rolesRes] = await Promise.all([fetch(`/api/profiles/${params.id}`), fetch("/api/roles")])

        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile")
        }

        if (!rolesRes.ok) {
          throw new Error("Failed to fetch roles")
        }

        const profileData = await profileRes.json()
        const rolesData = await rolesRes.json()

        setProfile(profileData)
        setRoles(rolesData)
      } catch (err) {
        console.error("[v0] Error fetching profile data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Failed to Load Profile</CardTitle>
            </div>
            <CardDescription>
              {error || "Profile not found. It may have been deleted or you may not have permission to view it."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/profiles")}>
                Back to Profiles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
        <p className="text-muted-foreground">Update the user profile information.</p>
      </div>

      <div className="flex justify-end">
        <CredentialsManager userId={profile.id} userEmail={profile.email} />
      </div>

      <ProfileForm profile={profile} roles={roles} />
    </div>
  )
}
