import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import bcrypt from "bcryptjs"

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { portal_access_enabled, portal_email, portal_password } = body

    console.log("[v0] Updating portal access for agent:", id)

    // Validate required fields if enabling portal access
    if (portal_access_enabled && !portal_email) {
      return NextResponse.json({ error: "Portal email is required when enabling access" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      portal_access_enabled: portal_access_enabled || false,
      portal_email: portal_email || null,
    }

    // Hash password if provided
    if (portal_password && portal_password.trim() !== "") {
      console.log("[v0] Hashing new password for agent portal")
      const hashedPassword = await bcrypt.hash(portal_password, 10)
      updateData.portal_password_hash = hashedPassword
    }

    // Update agent portal access
    if (updateData.portal_password_hash) {
      await sql`
        UPDATE agents
        SET 
          portal_access_enabled = ${updateData.portal_access_enabled}::boolean,
          portal_email = ${updateData.portal_email}::varchar,
          portal_password_hash = ${updateData.portal_password_hash}::varchar
        WHERE id = ${id}::uuid
      `
    } else {
      await sql`
        UPDATE agents
        SET 
          portal_access_enabled = ${updateData.portal_access_enabled}::boolean,
          portal_email = ${updateData.portal_email}::varchar
        WHERE id = ${id}::uuid
      `
    }

    console.log("[v0] Portal access updated successfully")

    return NextResponse.json({ success: true, message: "Portal access updated successfully" })
  } catch (error) {
    console.error("[v0] Error updating portal access:", error)
    return NextResponse.json(
      { error: "Failed to update portal access", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
