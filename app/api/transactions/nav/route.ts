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

// Lightweight endpoint — returns only id + label for Prev/Next navigation
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const isAssistant = auth.role === "assistant"
    const userId = auth.userId as string

    const statusOrder = "CASE t.status WHEN 'pending' THEN 1 WHEN 'closed' THEN 2 WHEN 'cancelled' THEN 3 ELSE 4 END"

    let rows

    if (isAssistant) {
      rows = await sql`
        SELECT t.id,
               p.address  AS property_address,
               p.city     AS property_city,
               t.status
        FROM transactions t
        LEFT JOIN properties p ON p.id = t.property_id
        INNER JOIN transaction_assignments ta ON ta.transaction_id = t.id AND ta.user_id = ${userId}::uuid
        WHERE t.is_active = true
        ORDER BY ${sql.unsafe(statusOrder)} ASC, t.closing_date ASC NULLS LAST
      `
    } else {
      rows = await sql`
        SELECT t.id,
               p.address  AS property_address,
               p.city     AS property_city,
               t.status
        FROM transactions t
        LEFT JOIN properties p ON p.id = t.property_id
        WHERE t.is_active = true
        ORDER BY ${sql.unsafe(statusOrder)} ASC, t.closing_date ASC NULLS LAST
      `
    }

    return NextResponse.json({ transactions: rows })
  } catch (error) {
    console.error("Error fetching transaction nav list:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
