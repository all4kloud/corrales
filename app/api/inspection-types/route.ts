import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET /api/inspection-types - List all inspection types
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active_only") !== "false"

    const inspectionTypes = await sql`
      SELECT * FROM inspection_types
      ${activeOnly ? sql`WHERE is_active = true` : sql``}
      ORDER BY display_order, name
    `

    return NextResponse.json({ inspectionTypes })
  } catch (error) {
    console.error("Error fetching inspection types:", error)
    return NextResponse.json({ error: "Failed to fetch inspection types" }, { status: 500 })
  }
}
