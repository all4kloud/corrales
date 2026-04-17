import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const profiles = await sql`
      SELECT 
        u.id,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.phone,
        u.role_id,
        r.name as role_name,
        u.is_active,
        u.created_at,
        a.license_number,
        a.brokerage as company
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN agents a ON u.id = a.user_id
      ORDER BY u.created_at DESC
    `

    return NextResponse.json(profiles)
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, middle_name, last_name, email, phone, role_id, company, license_number, is_active } = body

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 })
    }

    const roleIdInt = Number.parseInt(role_id, 10)

    const userResult = await sql`
      INSERT INTO users (
        first_name,
        middle_name,
        last_name, 
        email, 
        phone, 
        role_id,
        password_hash,
        is_active
      )
      VALUES (
        ${first_name},
        ${middle_name || null},
        ${last_name}, 
        ${email}, 
        ${phone}, 
        ${roleIdInt},
        'temp_password_hash',
        ${is_active ?? true}
      )
      RETURNING *
    `

    const user = userResult[0]

    if (license_number || company) {
      await sql`
        INSERT INTO agents (
          user_id,
          license_number,
          brokerage,
          is_active
        )
        VALUES (
          ${user.id},
          ${license_number || null},
          ${company || null},
          true
        )
      `
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error creating profile:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to create profile", details: errorMessage }, { status: 500 })
  }
}
