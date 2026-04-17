import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { isGoogleDriveConnected } from "@/lib/google-drive"
import sql from "sql-template-tag" // Declaring the sql variable

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

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const connected = await isGoogleDriveConnected()

    return NextResponse.json({
      connected,
      isAdmin: auth.role === "admin",
    })
  } catch (error) {
    console.error("[v0] Error checking Google Drive status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
