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

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const documentTypes = await sql`
      SELECT id, name, description
      FROM document_types
      WHERE is_active = true
      ORDER BY name ASC
    `

    return NextResponse.json({ documentTypes })
  } catch (error) {
    console.error("Error fetching document types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
