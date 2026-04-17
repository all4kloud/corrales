import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] GET /api/profiles/[id] - Starting request")
    const { id } = await params
    console.log("[v0] Profile ID:", id)

    const result = await sql`
      SELECT u.id, u.first_name, COALESCE(u.middle_name::text, '') as middle_name, u.last_name, 
             u.email, u.phone, u.role_id, u.is_active, u.created_at, u.updated_at,
             r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${id}
    `

    console.log("[v0] Query result length:", result.length)

    if (result.length === 0) {
      console.log("[v0] Profile not found")
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] Profile found, returning data")
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error fetching profile:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { first_name, middle_name, last_name, email, phone, role_id, is_active } = body

    const result = await sql`
      UPDATE users 
      SET 
        first_name = ${first_name},
        middle_name = ${middle_name || null},
        last_name = ${last_name},
        email = ${email},
        phone = ${phone},
        role_id = ${Number.parseInt(role_id) || null},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, first_name, middle_name, last_name, email, phone, role_id, is_active, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await sql`
      DELETE FROM users WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Profile deleted successfully" })
  } catch (error) {
    console.error("Error deleting profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
