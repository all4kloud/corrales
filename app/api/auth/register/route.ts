import { type NextRequest, NextResponse } from "next/server"
import { createUser, getUserByEmail } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, role } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Email, password, first name, and last name are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Get role ID (default to agent role)
    const roles = await sql`SELECT id FROM roles WHERE name = ${role || "agent"}`
    const roleId = roles[0]?.id || 3 // Default to agent role

    const user = await createUser({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      role_id: roleId,
    })

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
