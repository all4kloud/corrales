import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

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

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    // Delete Google Drive credentials from database
    // The google_drive_credentials table stores both tokens and folder config
    await sql`
      DELETE FROM google_drive_credentials 
      WHERE user_id = 'system'
    `

    return NextResponse.json({ 
      success: true, 
      message: "Google Drive disconnected successfully" 
    })
  } catch (error: any) {
    console.error("[v0] Error disconnecting Google Drive:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error?.message || "Unknown error"
    }, { status: 500 })
  }
}
