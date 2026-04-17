import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyPortalAuth } from "@/lib/portal-auth"

export async function PUT(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { preferredLanguage } = await request.json()

    // Validate language
    if (!["en", "es"].includes(preferredLanguage)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 })
    }

    const userId = auth.userId as string
    const isAgent = auth.isAgent === true

    if (isAgent) {
      // Update agent language preference
      await sql`
        UPDATE agents
        SET preferred_language = ${preferredLanguage}
        WHERE id = ${userId}::uuid
      `
    } else {
      // Update customer language preference via user email
      const users = await sql`
        SELECT email FROM users WHERE id = ${userId}::uuid
      `

      if (users.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      await sql`
        UPDATE customers
        SET preferred_language = ${preferredLanguage}
        WHERE email = ${users[0].email}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating language preference:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
