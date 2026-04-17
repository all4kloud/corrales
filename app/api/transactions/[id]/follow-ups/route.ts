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
    const followUps = await sql`
      SELECT
        fe.id,
        fe.event_name,
        fe.status,
        fe.priority,
        fe.due_date
      FROM follow_up_events fe
      WHERE fe.transaction_id = ${id}::uuid
      ORDER BY
        CASE fe.status
          WHEN 'pending'         THEN 1
          WHEN 'overdue'         THEN 1
          WHEN 'completed'       THEN 2
          WHEN 'not_applicable'  THEN 3
          ELSE                        1
        END ASC,
        CASE fe.priority
          WHEN 'urgent'  THEN 1
          WHEN 'high'    THEN 2
          WHEN 'medium'  THEN 3
          ELSE                4
        END ASC,
        fe.due_date ASC NULLS LAST
    `

    return NextResponse.json({ followUps })
  } catch (error) {
    console.error("Error fetching transaction follow-ups:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
