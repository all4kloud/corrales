import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyPassword } from "@/lib/auth"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // PRIORITY 1: Try to find agent with portal access first
    // This prevents conflicts when an admin has the same email
    const agents = await sql`
      SELECT a.id, a.portal_password_hash, a.portal_email, u.first_name, u.last_name, u.email
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE a.portal_email = ${email} AND a.portal_access_enabled = true AND a.is_active = true
    `

    const agent = agents[0]
    let isAgent = false

    if (agent) {
      // Agent with portal access found
      isAgent = true
      const isValidPassword = await verifyPassword(password, agent.portal_password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
    } else {
      // PRIORITY 2: Try to find customer user
      const users = await sql`
        SELECT u.*, r.name as role_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.email = ${email} AND u.is_active = true
      `

      const user = users[0]

      if (!user) {
        // No agent or customer found
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const isCustomer = user.role === "customer" || user.role_name === "customer"
      if (!isCustomer) {
        // User exists but is not a customer (e.g., admin/agent user without portal access)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const isValidPassword = await verifyPassword(password, user.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Store user for token creation
      var customerUser = user
    }

    // Create JWT token - Extended to 7 days for better user experience
    const tokenPayload = isAgent
      ? {
          sub: agent.id.toString(),
          userId: agent.id,
          email: agent.portal_email,
          role: "agent",
          isAgent: true,
        }
      : {
          sub: customerUser.id.toString(),
          userId: customerUser.id,
          email: customerUser.email,
          role: "customer",
        }

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    const responseData = isAgent
      ? {
          user: {
            id: agent.id,
            email: agent.portal_email,
            firstName: agent.first_name,
            lastName: agent.last_name,
            role: "agent",
          },
        }
      : {
          user: {
            id: customerUser.id,
            email: customerUser.email,
            firstName: customerUser.first_name,
            lastName: customerUser.last_name,
            role: "customer",
          },
        }

    const response = NextResponse.json(responseData)

    // Set HTTP-only cookie for portal - 7 days expiration
    response.cookies.set("portal-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Portal login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
