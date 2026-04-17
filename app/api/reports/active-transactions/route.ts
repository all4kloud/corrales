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
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || "2024-01-01"
    const endDate = searchParams.get("endDate") || "2024-12-31"

    console.log("[v0] Active transactions report - Date range:", startDate, "to", endDate)

    // Get active transactions with details
    const transactions = await sql`
      SELECT 
        t.id,
        t.transaction_type,
        t.status,
        t.priority,
        t.purchase_price,
        t.closing_date,
        t.created_at,
        COALESCE(p.address, 'N/A') as property_address,
        COALESCE(p.city, 'N/A') as property_city,
        COALESCE(p.state, 'N/A') as property_state,
        COALESCE(
          (SELECT STRING_AGG(COALESCE(c.first_name || ' ' || c.last_name, 'N/A'), ', ')
           FROM transaction_buyers tb
           JOIN customers c ON tb.customer_id = c.id
           WHERE tb.transaction_id = t.id),
          'N/A'
        ) as buyers,
        COALESCE(
          (SELECT STRING_AGG(COALESCE(c.first_name || ' ' || c.last_name, 'N/A'), ', ')
           FROM transaction_sellers ts
           JOIN customers c ON ts.customer_id = c.id
           WHERE ts.transaction_id = t.id),
          'N/A'
        ) as sellers,
        COALESCE(la_user.first_name || ' ' || la_user.last_name, 'N/A') as listing_agent_name,
        COALESCE(ba_user.first_name || ' ' || ba_user.last_name, 'N/A') as buyer_agent_name,
        COALESCE(cla_user.first_name || ' ' || cla_user.last_name, 'N/A') as co_listing_agent_name,
        COALESCE(cba_user.first_name || ' ' || cba_user.last_name, 'N/A') as co_buyer_agent_name
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN users la_user ON la.user_id = la_user.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      LEFT JOIN users ba_user ON ba.user_id = ba_user.id
      LEFT JOIN agents cla ON t.co_listing_agent_id = cla.id
      LEFT JOIN users cla_user ON cla.user_id = cla_user.id
      LEFT JOIN agents cba ON t.co_buyer_agent_id = cba.id
      LEFT JOIN users cba_user ON cba.user_id = cba_user.id
      WHERE t.status IN ('active', 'pending')
        AND t.created_at::date >= ${startDate}::date
        AND t.created_at::date <= ${endDate}::date
        AND t.is_active = true
      ORDER BY t.created_at DESC
    `

    console.log("[v0] Found transactions:", transactions.length)

    // Get summary statistics - don't filter by date to show all active transactions
    const summaryResult = await sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::int as active_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_count,
        COALESCE(SUM(purchase_price), 0)::numeric as total_value,
        COALESCE(AVG(purchase_price), 0)::numeric as avg_value,
        COUNT(CASE WHEN transaction_type = 'sale' THEN 1 END)::int as sales_count,
        COUNT(CASE WHEN transaction_type = 'purchase' THEN 1 END)::int as purchases_count
      FROM transactions
      WHERE status NOT IN ('closed', 'cancelled')
        AND is_active = true
    `
    
    // Map to expected frontend format
    const summary = {
      total: summaryResult[0]?.total || 0,
      activeCount: summaryResult[0]?.active_count || 0,
      pendingCount: summaryResult[0]?.pending_count || 0,
      totalValue: Number(summaryResult[0]?.total_value) || 0,
      avgValue: Number(summaryResult[0]?.avg_value) || 0,
      salesCount: summaryResult[0]?.sales_count || 0,
      purchasesCount: summaryResult[0]?.purchases_count || 0,
    }

    // Get transactions by status
    const byStatus = await sql`
      SELECT 
        status,
        COUNT(*)::int as count,
        COALESCE(SUM(purchase_price), 0)::numeric as total_value
      FROM transactions
      WHERE status IN ('active', 'pending')
        AND created_at::date >= ${startDate}::date
        AND created_at::date <= ${endDate}::date
        AND is_active = true
      GROUP BY status
    `

    // Get transactions by type
    const byType = await sql`
      SELECT 
        COALESCE(transaction_type, 'other') as name,
        COUNT(*)::int as count,
        COALESCE(SUM(purchase_price), 0)::numeric as total_value
      FROM transactions
      WHERE status NOT IN ('closed', 'cancelled')
        AND is_active = true
      GROUP BY transaction_type
    `

    return NextResponse.json({
      transactions,
      summary,
      byStatus,
      byType,
    })
  } catch (error) {
    console.error("[v0] Active transactions report error:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
