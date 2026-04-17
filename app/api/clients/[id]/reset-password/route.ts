import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"
import { generateTemporaryPassword } from "@/lib/generate-password"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] Reset password - Starting")

    const { id } = await params
    console.log("[v0] Reset password - Client ID:", id)

    // Get client details
    console.log("[v0] Reset password - Querying customer...")
    const customers = await sql`
      SELECT c.id, c.email, c.user_id
      FROM customers c
      WHERE c.id = ${id}
    `
    console.log("[v0] Reset password - Query result:", customers)

    if (!customers || customers.length === 0) {
      console.log("[v0] Reset password - Customer not found")
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const client = customers[0]
    console.log("[v0] Reset password - Customer:", { id: client.id, email: client.email, user_id: client.user_id })

    if (!client.user_id) {
      console.log("[v0] Reset password - No user_id")
      return NextResponse.json({ error: "Client does not have portal access" }, { status: 400 })
    }

    // Generate new temporary password
    console.log("[v0] Reset password - Generating password...")
    const temporaryPassword = generateTemporaryPassword()
    console.log("[v0] Reset password - Password generated, length:", temporaryPassword.length)

    // Hash password
    console.log("[v0] Reset password - Hashing password...")
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10)
    console.log("[v0] Reset password - Password hashed")

    // Update user password
    console.log("[v0] Reset password - Updating user password for user_id:", client.user_id)
    const updateResult = await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${client.user_id}
      RETURNING id
    `
    console.log("[v0] Reset password - Update result:", updateResult)

    console.log("[v0] Reset password - Success!")
    return NextResponse.json({
      success: true,
      credentials: {
        email: client.email,
        temporary_password: temporaryPassword,
        login_url: "/portal/login",
      },
    })
  } catch (error) {
    console.error("[v0] Error resetting password - Full error:", error)
    console.error("[v0] Error message:", error instanceof Error ? error.message : "Unknown error")
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
