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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const logs = await sql`
      SELECT
        el.id,
        el.to_email,
        el.party_name  AS to_name,
        el.cc_emails,
        el.subject,
        el.body,
        el.party_type,
        el.sent_at,
        u.first_name AS sent_by_first_name,
        u.last_name  AS sent_by_last_name
      FROM transaction_email_logs el
      LEFT JOIN users u ON el.sent_by = u.id
      WHERE el.transaction_id = ${id}::uuid
      ORDER BY el.sent_at DESC
    `

    // cc_emails is a native text[] — Neon driver returns it as a JS array already
    const parsed = logs.map((log) => ({
      ...log,
      cc_emails: Array.isArray(log.cc_emails) ? log.cc_emails : [],
    }))

    return NextResponse.json({ logs: parsed })
  } catch (error) {
    console.error("[v0] Error fetching email logs:", error)
    return NextResponse.json({ error: "Failed to fetch email logs" }, { status: 500 })
  }
}
