import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)

    // Get user email to find the customer
    const users = await sql`
      SELECT email FROM users WHERE id = ${payload.userId as string}::uuid
    `
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { smsNotificationsEnabled, emailNotificationsEnabled } = await request.json()

    // Update customer notification preferences by email
    await sql`
      UPDATE customers 
      SET 
        sms_notifications_enabled = ${smsNotificationsEnabled}::boolean,
        email_notifications_enabled = ${emailNotificationsEnabled}::boolean,
        updated_at = NOW()
      WHERE email = ${user.email}
    `

    return NextResponse.json({ 
      message: "Notification preferences updated successfully",
      smsNotificationsEnabled,
      emailNotificationsEnabled
    })
  } catch (error) {
    console.error("Error updating notification preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
