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

    // Get pending tasks with details - simplified query for performance
    const tasks = await sql`
      SELECT 
        f.id,
        f.event_name as title,
        f.description,
        f.due_date,
        f.priority,
        f.status,
        f.created_at,
        t.id as transaction_id,
        p.address as property_address,
        COALESCE(u_la.first_name || ' ' || u_la.last_name, '') as listing_agent_name,
        COALESCE(u_ba.first_name || ' ' || u_ba.last_name, '') as buyer_agent_name
      FROM follow_up_events f
      LEFT JOIN transactions t ON f.transaction_id = t.id
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN users u_la ON la.user_id = u_la.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      LEFT JOIN users u_ba ON ba.user_id = u_ba.id
      WHERE f.status IN ('pending', 'overdue')
      ORDER BY f.due_date ASC NULLS LAST, f.priority DESC
      LIMIT 100
    `

    // Get summary statistics - without date filter to show all pending tasks
    const summaryResult = await sql`
      SELECT 
        COUNT(*)::int as total_pending,
        COUNT(CASE WHEN priority = 'high' THEN 1 END)::int as high_priority,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END)::int as medium_priority,
        COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END)::int as overdue,
        COUNT(CASE WHEN due_date = CURRENT_DATE THEN 1 END)::int as due_today,
        COUNT(CASE WHEN due_date > CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END)::int as due_this_week
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
    `
    
    const summary = {
      total: summaryResult[0]?.total_pending || 0,
      highPriority: summaryResult[0]?.high_priority || 0,
      mediumPriority: summaryResult[0]?.medium_priority || 0,
      overdue: summaryResult[0]?.overdue || 0,
      dueToday: summaryResult[0]?.due_today || 0,
      dueThisWeek: summaryResult[0]?.due_this_week || 0,
    }

    // Get tasks by priority - without date filter
    const byPriorityResult = await sql`
      SELECT 
        COALESCE(priority, 'normal') as priority,
        COUNT(*)::int as count
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
      GROUP BY priority
    `
    
    const byPriority = byPriorityResult.map((p: any) => ({
      name: p.priority,
      count: p.count || 0,
    }))

    // Get tasks by due date range - without date filter
    const byDueDate = await sql`
      SELECT 
        CASE 
          WHEN due_date < CURRENT_DATE THEN 'overdue'
          WHEN due_date = CURRENT_DATE THEN 'today'
          WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'this_week'
          WHEN due_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'this_month'
          ELSE 'later'
        END as due_range,
        COUNT(*)::int as count
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
      GROUP BY due_range
      ORDER BY 
        CASE due_range
          WHEN 'overdue' THEN 1
          WHEN 'today' THEN 2
          WHEN 'this_week' THEN 3
          WHEN 'this_month' THEN 4
          ELSE 5
        END
    `

    return NextResponse.json({
      tasks,
      summary,
      byPriority,
      byDueDate,
    })
  } catch (error) {
    console.error("[v0] Pending tasks report error:", error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
