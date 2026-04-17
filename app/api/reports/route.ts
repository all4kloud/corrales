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
    const reportType = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let reportData = {}

    switch (reportType) {
      case "transactions":
        const transactionStats = await sql`
          SELECT 
            transaction_type,
            status,
            COUNT(*) as count,
            AVG(sale_price) as avg_price,
            SUM(sale_price) as total_volume
          FROM transactions 
          WHERE created_at >= ${startDate || "2024-01-01"} 
            AND created_at <= ${endDate || "2024-12-31"}
            AND is_active = true
          GROUP BY transaction_type, status
        `
        reportData = { transactionStats }
        break

      case "agents":
        const agentPerformance = await sql`
          SELECT 
            a.first_name || ' ' || a.last_name as agent_name,
            COUNT(t.id) as transaction_count,
            AVG(t.sale_price) as avg_transaction_value,
            SUM(t.sale_price) as total_volume
          FROM agents a
          LEFT JOIN transactions t ON a.id = t.agent_id
          WHERE t.created_at >= ${startDate || "2024-01-01"} 
            AND t.created_at <= ${endDate || "2024-12-31"}
            AND t.is_active = true
          GROUP BY a.id, a.first_name, a.last_name
          ORDER BY total_volume DESC
        `
        reportData = { agentPerformance }
        break

      case "properties":
        const propertyStats = await sql`
          SELECT 
            property_type,
            COUNT(*) as count,
            AVG(sale_price) as avg_price,
            MIN(sale_price) as min_price,
            MAX(sale_price) as max_price
          FROM transactions t
          JOIN properties p ON t.property_id = p.id
          WHERE t.created_at >= ${startDate || "2024-01-01"} 
            AND t.created_at <= ${endDate || "2024-12-31"}
            AND t.is_active = true
          GROUP BY property_type
        `
        reportData = { propertyStats }
        break

      case "overview":
        const overview = await sql`
          SELECT 
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_transactions,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_transactions,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
            AVG(CASE WHEN status = 'closed' THEN sale_price END) as avg_closed_price,
            SUM(CASE WHEN status = 'closed' THEN sale_price ELSE 0 END) as total_volume
          FROM transactions
          WHERE created_at >= ${startDate || "2024-01-01"} 
            AND created_at <= ${endDate || "2024-12-31"}
            AND is_active = true
        `
        reportData = { overview: overview[0] }
        break

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Reports API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
