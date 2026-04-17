import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"
import { generatePassword } from "@/lib/generate-password"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("[v0] Starting password reset for profile")

    const { id } = await params
    console.log("[v0] Profile ID:", id)

    // Get user from users table
    const users = await sql`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      WHERE u.id = ${id}
    `

    console.log("[v0] User query result:", users.length)

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]
    console.log("[v0] Found user:", user.email)

    // Generate new temporary password
    const newPassword = generatePassword()
    console.log("[v0] Generated new password")

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log("[v0] Password hashed successfully")

    // Update user password in database
    await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}
      WHERE id = ${id}
    `

    console.log("[v0] Password updated in database")

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      temporaryPassword: newPassword,
      email: user.email,
    })
  } catch (error) {
    console.error("[v0] Error resetting password:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
