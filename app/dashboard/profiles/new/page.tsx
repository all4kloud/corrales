import { ProfileForm } from "@/components/profiles/profile-form"
import { sql } from "@/lib/database"

async function getRoles() {
  try {
    const result = await sql`
      SELECT id, name 
      FROM roles 
      WHERE is_active = true
      ORDER BY name
    `
    return result
  } catch (error) {
    console.error("Error fetching roles:", error)
    return []
  }
}

export default async function NewProfilePage() {
  const roles = await getRoles()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Profile</h1>
        <p className="text-muted-foreground">Add a new user profile to your team.</p>
      </div>

      <ProfileForm roles={roles} />
    </div>
  )
}
