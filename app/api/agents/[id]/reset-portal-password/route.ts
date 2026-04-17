import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get agent details
    const agents = await sql`
      SELECT a.id, a.portal_email, a.portal_access_enabled, u.email, u.first_name, u.last_name
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ${id}::uuid AND a.is_active = true
    `

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]

    if (!agent.portal_access_enabled) {
      return NextResponse.json({ error: "Portal access is not enabled for this agent" }, { status: 400 })
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(8).toString("hex")
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

    // Update password in database
    await sql`
      UPDATE agents
      SET portal_password_hash = ${hashedPassword}
      WHERE id = ${id}::uuid
    `

    const loginEmail = agent.portal_email || agent.email

    return NextResponse.json({
      credentials: {
        email: loginEmail,
        temporary_password: temporaryPassword,
        login_url: "/portal/login",
      },
    })
  } catch (error) {
    console.error("Error resetting agent portal password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
