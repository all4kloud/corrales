import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const roles = await sql`
      SELECT 
        r.*,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON u.role = r.name
      GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at
      ORDER BY r.created_at DESC
    `

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, permissions, is_active = true } = await request.json()

    const result = await sql`
      INSERT INTO roles (name, description, permissions, is_active)
      VALUES (${name}, ${description}, ${JSON.stringify(permissions)}, ${is_active})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
