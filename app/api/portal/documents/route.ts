import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const isAgent = payload.isAgent === true
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    let documents

    if (isAgent) {
      // Agent: Get documents from their assigned transactions
      const agentId = payload.userId as string

      if (transactionId) {
        // Verify agent has access to this transaction
        const hasAccess = await sql`
          SELECT 1 FROM transactions
          WHERE id = ${transactionId}::uuid
          AND (
            listing_agent_id = ${agentId}::uuid
            OR buyer_agent_id = ${agentId}::uuid
            OR co_listing_agent_id = ${agentId}::uuid
            OR co_buyer_agent_id = ${agentId}::uuid
          )
        `

        if (hasAccess.length === 0) {
          return NextResponse.json({ documents: [] })
        }

        documents = await sql`
          SELECT 
            d.id,
            d.name as file_name,
            d.file_type,
            d.file_size,
            d.google_drive_url,
            d.created_at,
            d.transaction_id,
            d.task_id,
            fe.event_name as task_name
          FROM documents d
          LEFT JOIN follow_up_events fe ON d.task_id = fe.id
          WHERE (
            d.transaction_id = ${transactionId}::uuid
            OR (d.task_id IS NOT NULL AND fe.transaction_id = ${transactionId}::uuid)
          )
          ORDER BY d.created_at DESC
        `
      } else {
        // Get all documents from agent's transactions
        documents = await sql`
          SELECT DISTINCT
            d.id,
            d.name as file_name,
            d.file_type,
            d.file_size,
            d.google_drive_url,
            d.created_at,
            d.transaction_id,
            d.task_id,
            fe.event_name as task_name
          FROM documents d
          LEFT JOIN follow_up_events fe ON d.task_id = fe.id
          INNER JOIN transactions t ON (d.transaction_id = t.id OR fe.transaction_id = t.id)
          WHERE (
            t.listing_agent_id = ${agentId}::uuid
            OR t.buyer_agent_id = ${agentId}::uuid
            OR t.co_listing_agent_id = ${agentId}::uuid
            OR t.co_buyer_agent_id = ${agentId}::uuid
          )
          ORDER BY d.created_at DESC
        `
      }
    } else {
      // Customer: Get documents from their transactions
      const users = await sql`
        SELECT email FROM users WHERE id = ${payload.userId as string}::uuid
      `
      const user = users[0]
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const customers = await sql`
        SELECT id FROM customers WHERE email = ${user.email}
      `
      const customer = customers[0]
      if (!customer) {
        return NextResponse.json({ documents: [] })
      }

      if (transactionId) {
        const hasAccess = await sql`
          SELECT 1 FROM (
            SELECT transaction_id FROM transaction_buyers WHERE customer_id = ${customer.id}::uuid
            UNION
            SELECT transaction_id FROM transaction_sellers WHERE customer_id = ${customer.id}::uuid
          ) tc
          WHERE tc.transaction_id = ${transactionId}::uuid
        `
        
        if (hasAccess.length === 0) {
          return NextResponse.json({ documents: [] })
        }

        documents = await sql`
          SELECT 
            d.id,
            d.name as file_name,
            d.file_type,
            d.file_size,
            d.google_drive_url,
            d.created_at,
            d.transaction_id,
            d.task_id,
            fe.event_name as task_name
          FROM documents d
          LEFT JOIN follow_up_events fe ON d.task_id = fe.id
          WHERE (
            d.transaction_id = ${transactionId}::uuid
            OR (d.task_id IS NOT NULL AND fe.transaction_id = ${transactionId}::uuid)
          )
          ORDER BY d.created_at DESC
        `
      } else {
        documents = await sql`
          SELECT DISTINCT
            d.id,
            d.name as file_name,
            d.file_type,
            d.file_size,
            d.google_drive_url,
            d.created_at,
            d.transaction_id,
            d.task_id,
            fe.event_name as task_name
          FROM documents d
          LEFT JOIN follow_up_events fe ON d.task_id = fe.id
          WHERE (
            d.transaction_id IN (
              SELECT transaction_id FROM transaction_buyers WHERE customer_id = ${customer.id}::uuid
              UNION
              SELECT transaction_id FROM transaction_sellers WHERE customer_id = ${customer.id}::uuid
            )
            OR (d.task_id IS NOT NULL AND fe.transaction_id IN (
              SELECT transaction_id FROM transaction_buyers WHERE customer_id = ${customer.id}::uuid
              UNION
              SELECT transaction_id FROM transaction_sellers WHERE customer_id = ${customer.id}::uuid
            ))
          )
          ORDER BY d.created_at DESC
        `
      }
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Portal documents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
