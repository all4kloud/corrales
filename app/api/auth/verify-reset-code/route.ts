import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    // Verify reset code
    const resetCodes = await sql`
      SELECT * FROM password_reset_codes 
      WHERE email = ${email} AND code = ${code} AND expires_at > CURRENT_TIMESTAMP
    `

    if (resetCodes.length === 0) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
    }

    return NextResponse.json({ message: "Code verified successfully" })
  } catch (error) {
    console.error("Error verifying reset code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
