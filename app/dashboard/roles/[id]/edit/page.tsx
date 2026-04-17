import { notFound } from "next/navigation"
import { RoleForm } from "@/components/roles/role-form"
import { sql } from "@/lib/database"

interface EditRolePageProps {
  params: { id: string }
}

async function getRole(id: string) {
  try {
    const result = await sql`
      SELECT id, name, description, permissions, is_active, created_at, updated_at
      FROM roles 
      WHERE id = ${id}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching role:", error)
    return null
  }
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  const role = await getRole(params.id)

  if (!role) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
        <p className="text-muted-foreground">Update the role information and permissions.</p>
      </div>

      <RoleForm role={role} />
    </div>
  )
}
