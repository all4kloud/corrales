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
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assignedTo = searchParams.get("assigned_to")
    const overdue = searchParams.get("overdue")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const sort = searchParams.get("sort") || "due_date"
    const order = searchParams.get("order") || "asc"

    console.log("[v0] Follow-ups query params:", { transactionId, status, priority, assignedTo, overdue })

    if (transactionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId)) {
      return NextResponse.json(
        {
          error: "Invalid transaction ID format",
          details: "Transaction ID must be a valid UUID",
        },
        { status: 400 },
      )
    }

    let followUps

    if (transactionId) {
      followUps = await sql`
        SELECT 
          fe.*,
          t.transaction_type,
          p.address as property_address,
          p.city as property_city,
          p.state as property_state,
          u.first_name as assigned_first_name,
          u.last_name as assigned_last_name
        FROM follow_up_events fe
        LEFT JOIN transactions t ON fe.transaction_id = t.id
        LEFT JOIN properties p ON t.property_id = p.id
        LEFT JOIN users u ON fe.assigned_to = u.id
        WHERE fe.transaction_id = ${transactionId}
          AND (t.is_active = true OR t.is_active IS NULL)
          AND (t.status = 'pending' OR t.status IS NULL)
        ${status ? sql`AND fe.status = ${status}` : sql``}
        ${priority ? sql`AND fe.priority = ${priority}` : sql``}
        ${assignedTo ? sql`AND fe.assigned_to = ${assignedTo}::uuid` : sql``}
        ${overdue === "true" ? sql`AND fe.status = 'overdue'` : sql``}
        ORDER BY
          CASE fe.status
            WHEN 'pending'        THEN 1
            WHEN 'overdue'        THEN 1
            WHEN 'completed'      THEN 2
            WHEN 'not_applicable' THEN 3
            ELSE                       1
          END ASC,
          CASE fe.priority
            WHEN 'urgent' THEN 1
            WHEN 'high'   THEN 2
            WHEN 'medium' THEN 3
            ELSE               4
          END ASC,
          fe.due_date ASC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      followUps = await sql`
        SELECT 
          fe.*,
          t.transaction_type,
          t.id as transaction_id,
          p.address as property_address,
          p.city as property_city,
          p.state as property_state,
          u.first_name as assigned_first_name,
          u.last_name as assigned_last_name
        FROM follow_up_events fe
        LEFT JOIN transactions t ON fe.transaction_id = t.id
        LEFT JOIN properties p ON t.property_id = p.id
        LEFT JOIN users u ON fe.assigned_to = u.id
        WHERE (t.is_active = true OR t.is_active IS NULL)
          AND (t.status = 'pending' OR t.status IS NULL)
        ${status ? sql`AND fe.status = ${status}` : sql``}
        ${priority ? sql`AND fe.priority = ${priority}` : sql``}
        ${assignedTo ? sql`AND fe.assigned_to = ${assignedTo}::uuid` : sql``}
        ${overdue === "true" ? sql`AND fe.status = 'overdue'` : sql``}
        ORDER BY
          CASE fe.status
            WHEN 'pending'        THEN 1
            WHEN 'overdue'        THEN 1
            WHEN 'completed'      THEN 2
            WHEN 'not_applicable' THEN 3
            ELSE                       1
          END ASC,
          CASE fe.priority
            WHEN 'urgent' THEN 1
            WHEN 'high'   THEN 2
            WHEN 'medium' THEN 3
            ELSE               4
          END ASC,
          fe.due_date ASC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    console.log("[v0] Follow-ups fetched:", followUps.length)
    return NextResponse.json({ followUps })
  } catch (error) {
    console.error("[v0] Error fetching follow-ups:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()

    const followUp = await sql`
      INSERT INTO follow_up_events (
        transaction_id, event_name, description, due_date, priority, 
        assigned_to, notes
      ) VALUES (
        ${data.transaction_id}, ${data.event_name}, ${data.description}, 
        ${data.due_date}, ${data.priority || "medium"}, ${data.assigned_to}, ${data.notes}
      ) RETURNING *
    `

    return NextResponse.json({ followUp: followUp[0] })
  } catch (error) {
    console.error("Error creating follow-up:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
