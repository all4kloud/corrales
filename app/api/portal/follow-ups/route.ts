import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

async function verifyPortalAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyPortalAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = auth.userId as string
    const isAgent = auth.isAgent === true
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")

    let followUps

    if (isAgent) {
      // Agent: Get follow-ups from their assigned transactions
      if (transactionId) {
        // Verify agent has access to this transaction
        const accessCheck = await sql`
          SELECT 1 FROM transactions
          WHERE id = ${transactionId}::uuid
            AND is_active = true
            AND (
              listing_agent_id = ${userId}::uuid
              OR buyer_agent_id = ${userId}::uuid
              OR co_listing_agent_id = ${userId}::uuid
              OR co_buyer_agent_id = ${userId}::uuid
            )
        `

        if (accessCheck.length === 0) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        followUps = await sql`
          SELECT 
            f.id,
            f.event_name,
            f.description,
            f.due_date,
            f.status,
            f.priority,
            f.transaction_id
          FROM follow_up_events f
          WHERE f.transaction_id = ${transactionId}::uuid
            AND f.status != 'not_applicable'
          ORDER BY
            CASE WHEN f.status IN ('pending','in_progress') THEN 0 ELSE 1 END,
            f.due_date ASC
        `
      } else {
        // Get all follow-ups from agent's transactions
        followUps = await sql`
          SELECT 
            f.id,
            f.event_name,
            f.description,
            f.due_date,
            f.status,
            f.priority,
            f.transaction_id
          FROM follow_up_events f
          INNER JOIN transactions t ON f.transaction_id = t.id
          WHERE t.is_active = true
            AND f.status != 'not_applicable'
            AND (
              t.listing_agent_id = ${userId}::uuid
              OR t.buyer_agent_id = ${userId}::uuid
              OR t.co_listing_agent_id = ${userId}::uuid
              OR t.co_buyer_agent_id = ${userId}::uuid
            )
          ORDER BY
            CASE WHEN f.status IN ('pending','in_progress') THEN 0 ELSE 1 END,
            f.due_date ASC
        `
      }
    } else {
      // Customer: Get follow-ups from their transactions
      const customers = await sql`
        SELECT id FROM customers WHERE user_id = ${userId}::uuid
      `

      if (customers.length === 0) {
        return NextResponse.json({ followUps: [] })
      }

      const customerIds = customers.map((c) => c.id)

      if (transactionId) {
        // Verify access to this transaction
        const accessCheck = await sql`
          SELECT 1 FROM transactions t
          LEFT JOIN transaction_buyers tb ON t.id = tb.transaction_id
          LEFT JOIN transaction_sellers ts ON t.id = ts.transaction_id
          WHERE t.id = ${transactionId}::uuid
            AND t.is_active = true
            AND (
              tb.customer_id = ANY(${customerIds}::uuid[])
              OR ts.customer_id = ANY(${customerIds}::uuid[])
            )
        `

        if (accessCheck.length === 0) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        followUps = await sql`
          SELECT 
            f.id,
            f.event_name,
            f.description,
            f.due_date,
            f.status,
            f.priority,
            f.transaction_id
          FROM follow_up_events f
          WHERE f.transaction_id = ${transactionId}::uuid
            AND f.status != 'not_applicable'
          ORDER BY
            CASE WHEN f.status IN ('pending','in_progress') THEN 0 ELSE 1 END,
            f.due_date ASC
        `
      } else {
        // Get all follow-ups for transactions customer has access to
        followUps = await sql`
          SELECT 
            f.id,
            f.event_name,
            f.description,
            f.due_date,
            f.status,
            f.priority,
            f.transaction_id
          FROM follow_up_events f
          INNER JOIN transactions t ON f.transaction_id = t.id
          LEFT JOIN transaction_buyers tb ON t.id = tb.transaction_id
          LEFT JOIN transaction_sellers ts ON t.id = ts.transaction_id
          WHERE t.is_active = true
            AND f.status != 'not_applicable'
            AND (
              tb.customer_id = ANY(${customerIds}::uuid[])
              OR ts.customer_id = ANY(${customerIds}::uuid[])
            )
          ORDER BY
            CASE WHEN f.status IN ('pending','in_progress') THEN 0 ELSE 1 END,
            f.due_date ASC
        `
      }
    }

    return NextResponse.json({ followUps })
  } catch (error) {
    console.error("Error fetching portal follow-ups:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
