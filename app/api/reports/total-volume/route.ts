import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import type { JWTVerifyResult } from "jose/dist/types"
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

async function verifyAuth(request: NextRequest): Promise<JWTVerifyResult | null> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return payload as JWTVerifyResult
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

    // Get total volume summary - without date filter to show all data
    const summaryResult = await sql`
      SELECT 
        COUNT(*)::int as total_transactions,
        COALESCE(SUM(purchase_price), 0)::numeric as total_volume,
        COALESCE(AVG(purchase_price), 0)::numeric as avg_transaction_value,
        COALESCE(MIN(purchase_price), 0)::numeric as min_value,
        COALESCE(MAX(purchase_price), 0)::numeric as max_value,
        COUNT(CASE WHEN status = 'closed' THEN 1 END)::int as closed_count,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN purchase_price ELSE 0 END), 0)::numeric as closed_volume,
        COALESCE(SUM(CASE WHEN status NOT IN ('closed', 'cancelled') THEN purchase_price ELSE 0 END), 0)::numeric as active_volume
      FROM transactions
      WHERE is_active = true
    `
    
    const summary = {
      totalTransactions: summaryResult[0]?.total_transactions || 0,
      totalVolume: Number(summaryResult[0]?.total_volume) || 0,
      avgTransactionValue: Number(summaryResult[0]?.avg_transaction_value) || 0,
      minValue: Number(summaryResult[0]?.min_value) || 0,
      maxValue: Number(summaryResult[0]?.max_value) || 0,
      closedCount: summaryResult[0]?.closed_count || 0,
      closedVolume: Number(summaryResult[0]?.closed_volume) || 0,
      activeVolume: Number(summaryResult[0]?.active_volume) || 0,
    }

    // Get volume by month
    const byMonth = await sql`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as transaction_count,
        SUM(purchase_price) as total_volume,
        AVG(purchase_price) as avg_value
      FROM transactions
      WHERE created_at >= ${startDate}::date
        AND created_at <= ${endDate}::date
        AND is_active = true
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `

    // Get volume by transaction type
    const byType = await sql`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(purchase_price) as total_volume,
        AVG(purchase_price) as avg_value
      FROM transactions
      WHERE created_at >= ${startDate}::date
        AND created_at <= ${endDate}::date
        AND is_active = true
      GROUP BY transaction_type
    `

    // Get volume by agent (using listing_agent_id)
    const byAgent = await sql`
      SELECT 
        u.first_name || ' ' || u.last_name as agent_name,
        COUNT(t.id) as transaction_count,
        SUM(t.purchase_price) as total_volume,
        AVG(t.purchase_price) as avg_value
      FROM agents a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN transactions t ON a.id = t.listing_agent_id
      WHERE t.created_at >= ${startDate}::date
        AND t.created_at <= ${endDate}::date
        AND t.is_active = true
        AND a.is_active = true
      GROUP BY a.id, u.first_name, u.last_name
      ORDER BY total_volume DESC
      LIMIT 10
    `

    // Get top transactions
    const topTransactions = await sql`
      SELECT 
        t.id,
        t.transaction_type,
        t.status,
        t.purchase_price,
        t.closing_date,
        p.address as property_address,
        p.city as property_city,
        COALESCE(
          (SELECT STRING_AGG(COALESCE(c.first_name || ' ' || c.last_name, ''), ', ')
           FROM transaction_buyers tb
           JOIN customers c ON tb.customer_id = c.id
           WHERE tb.transaction_id = t.id),
          'N/A'
        ) as client_name,
        COALESCE(la_user.first_name || ' ' || la_user.last_name, 'N/A') as listing_agent_name,
        COALESCE(ba_user.first_name || ' ' || ba_user.last_name, 'N/A') as buyer_agent_name
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN users la_user ON la.user_id = la_user.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      LEFT JOIN users ba_user ON ba.user_id = ba_user.id
      WHERE t.created_at >= ${startDate}::date
        AND t.created_at <= ${endDate}::date
        AND t.is_active = true
      ORDER BY t.purchase_price DESC
      LIMIT 10
    `

    // Transform byMonth for chart
    const trend = byMonth.map((m: any) => ({
      month: m.month,
      volume: Number(m.total_volume) || 0,
      count: m.transaction_count || 0,
    }))

    // Transform byType for chart
    const byTypeFormatted = byType.map((t: any) => ({
      type: t.transaction_type || 'other',
      volume: Number(t.total_volume) || 0,
      count: t.count || 0,
    }))

    return NextResponse.json({
      summary,
      trend,
      byMonth,
      byType: byTypeFormatted,
      byAgent,
      topTransactions,
    })
  } catch (error) {
    console.error("Total volume report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
