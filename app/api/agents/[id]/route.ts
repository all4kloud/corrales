import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import { hashPassword } from "@/lib/auth"
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const agents = await sql`
      SELECT 
        a.*,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.phone,
        a.portal_access_enabled,
        a.portal_email
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ${id} AND a.is_active = true
    `

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ agent: agents[0] })
  } catch (error) {
    console.error("Error fetching agent:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    const agentInfo = await sql`
      SELECT a.user_id, a.portal_access_enabled
      FROM agents a
      WHERE a.id = ${id}
    `

    if (agentInfo.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const specialties = data.specialties && data.specialties.trim() !== "" ? data.specialties : null

    const agent = await sql`
      UPDATE agents SET
        license_number = ${data.license_number},
        brokerage = ${data.brokerage},
        commission_rate = ${data.commission_rate || null},
        specialties = ${specialties},
        bio = ${data.bio || ""},
        portal_access_enabled = ${data.portal_access_enabled !== undefined ? data.portal_access_enabled : false},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (agent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // Fetch user data for response
    const user = await sql`
      SELECT first_name, middle_name, last_name, email, phone
      FROM users
      WHERE id = ${agentInfo[0].user_id}
    `

    // Check if portal access was just enabled (was false before, now true)
    const wasPortalEnabled = agentInfo[0].portal_access_enabled
    const isNowEnabled = data.portal_access_enabled === true
    const needsCredentials = !wasPortalEnabled && isNowEnabled

    let portalCredentials = null

    if (needsCredentials && user.length > 0) {
      // Generate temporary password
      const temporaryPassword = crypto.randomBytes(8).toString("hex")
      const hashedPassword = await hashPassword(temporaryPassword)

      // Use agent's email for portal access
      const portalEmail = user[0].email

      // Update agent with portal credentials
      await sql`
        UPDATE agents
        SET 
          portal_email = ${portalEmail},
          portal_password_hash = ${hashedPassword}
        WHERE id = ${id}
      `

      portalCredentials = {
        email: portalEmail,
        temporary_password: temporaryPassword,
        login_url: "/portal/login",
      }
    }

    const responseData: any = {
      agent: {
        ...agent[0],
        first_name: user[0]?.first_name,
        middle_name: user[0]?.middle_name,
        last_name: user[0]?.last_name,
        email: user[0]?.email,
        phone: user[0]?.phone,
      },
    }

    if (portalCredentials) {
      responseData.portal_credentials = portalCredentials
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating agent:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await sql`
      UPDATE agents 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Agent deleted successfully" })
  } catch (error) {
    console.error("Error deleting agent:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
