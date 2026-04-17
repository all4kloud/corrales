import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Find valid token
    const tokens = await sql`
      SELECT user_id, used 
      FROM password_reset_tokens 
      WHERE token = ${token} 
        AND expires_at > NOW()
        AND used = false
    `

    if (tokens.length === 0) {
      return NextResponse.json({ 
        error: "Invalid or expired token. Please request a new password reset link." 
      }, { status: 400 })
    }

    const resetToken = tokens[0]

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await sql`
      UPDATE users 
      SET password = ${hashedPassword}, 
          updated_at = NOW()
      WHERE id = ${resetToken.user_id}::uuid
    `

    // Mark token as used
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE token = ${token}
    `

    return NextResponse.json({ 
      message: "Password reset successful. You can now log in with your new password." 
    })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
