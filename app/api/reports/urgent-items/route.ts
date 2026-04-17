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

    // Get urgent follow-ups (only priority = 'urgent') - matches dashboard count
    const urgentTasks = await sql`
      SELECT 
        f.id,
        f.event_name as title,
        f.description,
        f.due_date,
        f.priority,
        f.status,
        f.created_at,
        t.id as transaction_id,
        t.status as transaction_status,
        p.address as property_address,
        COALESCE(
          (SELECT STRING_AGG(c.first_name || ' ' || c.last_name, ', ')
           FROM transaction_buyers tb
           JOIN customers c ON tb.customer_id = c.id
           WHERE tb.transaction_id = t.id),
          'N/A'
        ) as client_name,
        COALESCE(u_la.first_name || ' ' || u_la.last_name, 'N/A') as listing_agent_name,
        COALESCE(u_ba.first_name || ' ' || u_ba.last_name, 'N/A') as buyer_agent_name,
        CASE 
          WHEN f.due_date < CURRENT_DATE THEN 'overdue'
          WHEN f.due_date = CURRENT_DATE THEN 'due_today'
          ELSE 'upcoming'
        END as urgency_level
      FROM follow_up_events f
      LEFT JOIN transactions t ON f.transaction_id = t.id
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN users u_la ON la.user_id = u_la.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      LEFT JOIN users u_ba ON ba.user_id = u_ba.id
      WHERE f.status IN ('pending', 'overdue')
        AND f.priority = 'urgent'
      ORDER BY 
        CASE 
          WHEN f.due_date < CURRENT_DATE THEN 1
          WHEN f.due_date = CURRENT_DATE THEN 2
          ELSE 3
        END,
        f.due_date ASC
    `

    // Get urgent transactions (closing soon or high priority) - no date filter
    const urgentTransactions = await sql`
      SELECT 
        t.id,
        t.transaction_type,
        t.status,
        t.priority,
        t.purchase_price,
        t.closing_date,
        t.created_at,
        p.address as property_address,
        p.city as property_city,
        COALESCE(
          (SELECT STRING_AGG(c.first_name || ' ' || c.last_name, ', ')
           FROM transaction_buyers tb
           JOIN customers c ON tb.customer_id = c.id
           WHERE tb.transaction_id = t.id),
          'N/A'
        ) as client_name,
        COALESCE(u_la.first_name || ' ' || u_la.last_name, 'N/A') as listing_agent_name,
        COALESCE(u_ba.first_name || ' ' || u_ba.last_name, 'N/A') as buyer_agent_name,
        CASE 
          WHEN t.closing_date < CURRENT_DATE THEN 'overdue'
          WHEN t.closing_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'closing_soon'
          ELSE 'high_priority'
        END as urgency_reason
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN users u_la ON la.user_id = u_la.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      LEFT JOIN users u_ba ON ba.user_id = u_ba.id
      WHERE t.status IN ('active', 'pending')
        AND (t.priority = 'high' OR t.closing_date <= CURRENT_DATE + INTERVAL '7 days')
        AND t.is_active = true
      ORDER BY t.closing_date ASC, t.priority DESC
    `

    // Get summary statistics - only priority = 'urgent' to match dashboard
    const tasksSummary = await sql`
      SELECT 
        COUNT(*)::int as total_urgent_tasks,
        COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END)::int as overdue_tasks,
        COUNT(CASE WHEN due_date = CURRENT_DATE THEN 1 END)::int as due_today_tasks
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
        AND priority = 'urgent'
    `
    
    const summary = {
      total: tasksSummary[0]?.total_urgent_tasks || 0,
      overdue: tasksSummary[0]?.overdue_tasks || 0,
      dueToday: tasksSummary[0]?.due_today_tasks || 0,
    }

    // Get urgency breakdown for urgent tasks only
    const urgencyBreakdown = await sql`
      SELECT 
        'Overdue' as category,
        COUNT(*)::int as count
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
        AND priority = 'urgent'
        AND due_date < CURRENT_DATE
      UNION ALL
      SELECT 
        'Due Today' as category,
        COUNT(*)::int as count
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
        AND priority = 'urgent'
        AND due_date = CURRENT_DATE
      UNION ALL
      SELECT 
        'Upcoming' as category,
        COUNT(*)::int as count
      FROM follow_up_events
      WHERE status IN ('pending', 'overdue')
        AND priority = 'urgent'
        AND due_date > CURRENT_DATE
    `
    
    // Format for chart
    const byCategory = urgencyBreakdown.map((item: any) => ({
      category: item.category,
      count: item.count || 0,
    }))

    // Format items for list
    const items = urgentTasks.slice(0, 10).map((task: any) => ({
      title: task.title,
      description: task.description || task.property_address || '',
      priority: task.priority,
      dueDate: task.due_date,
    }))

    return NextResponse.json({
      urgentTasks,
      urgentTransactions,
      summary,
      urgencyBreakdown,
      byCategory,
      items,
    })
  } catch (error) {
    console.error("Urgent items report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
