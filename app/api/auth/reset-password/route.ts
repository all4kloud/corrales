import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json()

    // Verify reset code again
    const resetCodes = await sql`
      SELECT * FROM password_reset_codes 
      WHERE email = ${email} AND code = ${code} AND expires_at > CURRENT_TIMESTAMP
    `

    if (resetCodes.length === 0) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
    `

    // Delete used reset code
    await sql`
      DELETE FROM password_reset_codes WHERE email = ${email}
    `

    return NextResponse.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
