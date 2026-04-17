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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyPortalAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: transactionId } = await params

  try {
    const userId = auth.userId as string
    const isAgent = auth.isAgent === true

    if (isAgent) {
      // Agent: Verify agent has access to this transaction
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
    } else {
      // Customer: Get customer ID and verify access
      const customers = await sql`
        SELECT id FROM customers WHERE user_id = ${userId}::uuid
      `

      if (customers.length === 0) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      const customerIds = customers.map((c) => c.id)

      // Verify customer has access to this transaction
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
    }

    // Fetch full transaction details
    const transactions = isAgent
      ? await sql`
          SELECT 
            t.*,
            p.address as property_address,
            p.city as property_city,
            p.state as property_state,
            p.zip_code as property_zip,
            lau.first_name as listing_agent_first_name,
            lau.last_name as listing_agent_last_name,
            bau.first_name as buyer_agent_first_name,
            bau.last_name as buyer_agent_last_name,
            l.company_name as lender_company_name,
            l.contact_name as lender_contact_name,
            a.firm_name as attorney_firm_name,
            a.attorney_name as attorney_attorney_name,
            CASE 
              WHEN t.listing_agent_id = ${userId}::uuid THEN 'listing_agent'
              WHEN t.buyer_agent_id = ${userId}::uuid THEN 'buyer_agent'
              WHEN t.co_listing_agent_id = ${userId}::uuid THEN 'co_listing_agent'
              WHEN t.co_buyer_agent_id = ${userId}::uuid THEN 'co_buyer_agent'
            END as role
          FROM transactions t
          LEFT JOIN properties p ON t.property_id = p.id
          LEFT JOIN agents la ON t.listing_agent_id = la.id
          LEFT JOIN users lau ON la.user_id = lau.id
          LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
          LEFT JOIN users bau ON ba.user_id = bau.id
          LEFT JOIN lenders l ON t.lender_id = l.id
          LEFT JOIN attorneys a ON t.attorney_id = a.id
          WHERE t.id = ${transactionId}::uuid
        `
      : await sql`
          SELECT 
            t.*,
            p.address as property_address,
            p.city as property_city,
            p.state as property_state,
            p.zip_code as property_zip,
            lau.first_name as listing_agent_first_name,
            lau.last_name as listing_agent_last_name,
            bau.first_name as buyer_agent_first_name,
            bau.last_name as buyer_agent_last_name,
            l.company_name as lender_company_name,
            l.contact_name as lender_contact_name,
            a.firm_name as attorney_firm_name,
            a.attorney_name as attorney_attorney_name,
            CASE 
              WHEN tb.customer_id IS NOT NULL THEN 'buyer'
              WHEN ts.customer_id IS NOT NULL THEN 'seller'
            END as role
          FROM transactions t
          LEFT JOIN properties p ON t.property_id = p.id
          LEFT JOIN agents la ON t.listing_agent_id = la.id
          LEFT JOIN users lau ON la.user_id = lau.id
          LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
          LEFT JOIN users bau ON ba.user_id = bau.id
          LEFT JOIN lenders l ON t.lender_id = l.id
          LEFT JOIN attorneys a ON t.attorney_id = a.id
          LEFT JOIN transaction_buyers tb ON t.id = tb.transaction_id
          LEFT JOIN transaction_sellers ts ON t.id = ts.transaction_id
          WHERE t.id = ${transactionId}::uuid
            AND (
              tb.customer_id IN (SELECT id FROM customers WHERE user_id = ${userId}::uuid)
              OR ts.customer_id IN (SELECT id FROM customers WHERE user_id = ${userId}::uuid)
            )
        `

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const row = transactions[0]

    // Destructure to exclude internal-only fields before sending to portal
    const { notes: _notes, ...publicRow } = row

    return NextResponse.json({
      transaction: {
        ...publicRow,
        listing_agent: row.listing_agent_first_name
          ? {
              first_name: row.listing_agent_first_name,
              last_name: row.listing_agent_last_name,
            }
          : null,
        selling_agent: row.selling_agent_first_name
          ? {
              first_name: row.selling_agent_first_name,
              last_name: row.selling_agent_last_name,
            }
          : null,
        buyer_agent: row.buyer_agent_first_name
          ? {
              first_name: row.buyer_agent_first_name,
              last_name: row.buyer_agent_last_name,
            }
          : null,
        lender: row.lender_company_name
          ? {
              company_name: row.lender_company_name,
              contact_name: row.lender_contact_name,
            }
          : null,
        attorney: row.attorney_firm_name
          ? {
              firm_name: row.attorney_firm_name,
              attorney_name: row.attorney_attorney_name,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Error fetching portal transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
