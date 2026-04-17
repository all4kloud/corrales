import { RoleForm } from "@/components/roles/role-form"

export default function NewRolePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Role</h1>
        <p className="text-muted-foreground">Define a new role with specific permissions for your team members.</p>
      </div>

      <RoleForm />
    </div>
  )
}
