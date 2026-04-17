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

    if (isAgent) {
      // For agents: Get transactions where they are assigned as any agent role
      const transactions = await sql`
        SELECT DISTINCT
          t.*,
          p.address as property_address,
          p.city as property_city,
          p.state as property_state,
          p.zip_code as property_zip,
          CASE 
            WHEN t.listing_agent_id = ${userId}::uuid THEN 'listing_agent'
            WHEN t.buyer_agent_id = ${userId}::uuid THEN 'buyer_agent'
            WHEN t.co_listing_agent_id = ${userId}::uuid THEN 'co_listing_agent'
            WHEN t.co_buyer_agent_id = ${userId}::uuid THEN 'co_buyer_agent'
          END as role
        FROM transactions t
        LEFT JOIN properties p ON t.property_id = p.id
        WHERE t.is_active = true
          AND (
            t.listing_agent_id = ${userId}::uuid 
            OR t.buyer_agent_id = ${userId}::uuid
            OR t.co_listing_agent_id = ${userId}::uuid
            OR t.co_buyer_agent_id = ${userId}::uuid
          )
        ORDER BY t.created_at DESC
      `
      return NextResponse.json({ transactions })
    } else {
      // For customers: Get transactions where user is a buyer or seller
      const customers = await sql`
        SELECT id FROM customers WHERE user_id = ${userId}::uuid
      `

      if (customers.length === 0) {
        return NextResponse.json({ transactions: [] })
      }

      const customerIds = customers.map((c) => c.id)

      const transactions = await sql`
        SELECT DISTINCT
          t.*,
          p.address as property_address,
          p.city as property_city,
          p.state as property_state,
          p.zip_code as property_zip,
          CASE 
            WHEN tb.customer_id IS NOT NULL THEN 'buyer'
            WHEN ts.customer_id IS NOT NULL THEN 'seller'
          END as role
        FROM transactions t
        LEFT JOIN properties p ON t.property_id = p.id
        LEFT JOIN transaction_buyers tb ON t.id = tb.transaction_id AND tb.customer_id = ANY(${customerIds}::uuid[])
        LEFT JOIN transaction_sellers ts ON t.id = ts.transaction_id AND ts.customer_id = ANY(${customerIds}::uuid[])
        WHERE t.is_active = true
          AND (tb.customer_id IS NOT NULL OR ts.customer_id IS NOT NULL)
        ORDER BY t.created_at DESC
      `

      return NextResponse.json({ transactions })
    }
  } catch (error) {
    console.error("Error fetching portal transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
