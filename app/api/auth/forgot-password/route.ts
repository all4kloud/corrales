import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Forgot password request received")

    const { email } = await request.json()
    console.log("[v0] Email from request:", email)

    // Check if user exists
    const users = await sql`
      SELECT id, first_name, last_name FROM users WHERE email = ${email}
    `

    console.log("[v0] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)
    console.log("[v0] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL)

    if (users.length === 0) {
      return NextResponse.json({ message: "If the email exists, a reset code has been sent" })
    }

    const user = users[0]
    console.log("[v0] User found:", user.id, user.first_name, user.last_name)

    // Generate 6-digit code
    const resetCode = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store reset code in database
    await sql`
      INSERT INTO password_reset_codes (email, code, expires_at)
      VALUES (${email}, ${resetCode}, ${expiresAt})
      ON CONFLICT (email) 
      DO UPDATE SET code = ${resetCode}, expires_at = ${expiresAt}, created_at = CURRENT_TIMESTAMP
    `

    console.log("[v0] Attempting to send email to:", email)
    console.log("[v0] Reset code:", resetCode)

    const emailResult = await sendPasswordResetEmail(email, resetCode, `${user.first_name} ${user.last_name}`)

    console.log("[v0] Email send result:", JSON.stringify(emailResult, null, 2))

    if (!emailResult.success) {
      console.error("[v0] Failed to send email:", emailResult.error)
      console.log(`[v0] Password reset code for ${email}: ${resetCode}`)
    } else {
      console.log("[v0] Email sent successfully!")
    }

    return NextResponse.json({
      message: "If the email exists, a reset code has been sent",
      ...(process.env.NODE_ENV === "development" && { code: resetCode }),
    })
  } catch (error) {
    console.error("[v0] Error sending reset code:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
