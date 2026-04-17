import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const result = await sql`
      SELECT id, name, description, permissions, is_active, created_at, updated_at
      FROM roles 
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = await request.json()
    const { name, description, permissions, is_active } = body

    const result = await sql`
      UPDATE roles 
      SET 
        name = ${name},
        description = ${description},
        permissions = ${JSON.stringify(permissions)},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, description, permissions, is_active, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    // Check if role is being used by any users
    const usersWithRole = await sql`
      SELECT COUNT(*) as count FROM users WHERE role_id = ${id}
    `

    if (usersWithRole[0].count > 0) {
      return NextResponse.json({ error: "Cannot delete role that is assigned to users" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM roles WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
