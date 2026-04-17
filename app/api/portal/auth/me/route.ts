import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const isAgent = payload.isAgent === true

    if (isAgent) {
      // Agent portal access
      const agents = await sql`
        SELECT a.id, a.portal_email, a.preferred_language, u.first_name, u.last_name, u.email
        FROM agents a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ${payload.userId as string}::uuid AND a.is_active = true
      `

      const agent = agents[0]
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }

      return NextResponse.json({
        user: {
          id: agent.id,
          email: agent.portal_email,
          firstName: agent.first_name,
          lastName: agent.last_name,
          role: "agent",
          agentId: agent.id,
          preferredLanguage: agent.preferred_language || "es",
        },
      })
    } else {
      // Customer portal access
      const users = await sql`
        SELECT id, email, first_name, last_name, role
        FROM users 
        WHERE id = ${payload.userId as string}::uuid AND is_active = true
      `

      const user = users[0]
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Get customer record to fetch notification preferences
      const customers = await sql`
        SELECT id, sms_notifications_enabled, email_notifications_enabled, preferred_language
        FROM customers 
        WHERE email = ${user.email}
        LIMIT 1
      `
      
      const customer = customers[0]

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          customerId: customer?.id || null,
          smsNotificationsEnabled: customer?.sms_notifications_enabled ?? false,
          emailNotificationsEnabled: customer?.email_notifications_enabled ?? false,
          preferredLanguage: customer?.preferred_language || "es",
        },
      })
    }
  } catch (error) {
    console.error("Portal auth check error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
