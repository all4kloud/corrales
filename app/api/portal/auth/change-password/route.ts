import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const userId = payload.userId as string
    const isAgent = payload.isAgent === true

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    if (isAgent) {
      // Agent with portal access
      const agents = await sql`
        SELECT id, portal_password_hash FROM agents WHERE id = ${userId}::uuid
      `

      if (agents.length === 0) {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }

      const agent = agents[0]

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, agent.portal_password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      // Update password
      await sql`
        UPDATE agents 
        SET portal_password_hash = ${newPasswordHash}, updated_at = NOW()
        WHERE id = ${userId}::uuid
      `
    } else {
      // Customer user
      const users = await sql`
        SELECT id, password_hash FROM users WHERE id = ${userId}::uuid
      `

      if (users.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const user = users[0]

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      // Update password
      await sql`
        UPDATE users 
        SET password_hash = ${newPasswordHash}, updated_at = NOW()
        WHERE id = ${userId}::uuid
      `
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
