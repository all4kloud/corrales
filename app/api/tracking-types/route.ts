import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const trackingTypes = await sql`
      SELECT id, code, name, description, is_active, display_order
      FROM tracking_types
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
    `

    return NextResponse.json(trackingTypes)
  } catch (error) {
    console.error("Error fetching tracking types:", error)
    return NextResponse.json({ error: "Failed to fetch tracking types" }, { status: 500 })
  }
}
