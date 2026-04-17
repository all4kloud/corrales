import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Get dashboard statistics from database
    const [transactionStats, taskStats, entityCounts] = await Promise.all([
      // Transaction statistics
      sql`
        SELECT 
          COUNT(*) as active_transactions,
          COALESCE(SUM(purchase_price), 0) as total_volume,
          COUNT(CASE WHEN status IN ('pending', 'under_contract', 'contingent') THEN 1 END) as active_count
        FROM transactions 
        WHERE status NOT IN ('closed', 'cancelled')
          AND is_active = true
      `,

      // Task/Follow-up statistics
      sql`
        SELECT 
          COUNT(CASE WHEN status IN ('pending', 'overdue') THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN status IN ('pending', 'overdue') AND priority = 'urgent' THEN 1 END) as urgent_items,
          COUNT(CASE WHEN due_date < CURRENT_DATE AND status IN ('pending', 'overdue') THEN 1 END) as overdue_tasks
        FROM follow_up_events
      `,

      // Entity counts
      sql`
        SELECT 
          (SELECT COUNT(*) FROM customers) as clients_count,
          (SELECT COUNT(*) FROM properties) as properties_count,
          (SELECT COUNT(*) FROM agents) as agents_count,
          (SELECT COUNT(*) FROM lenders WHERE is_active = true) as lenders_count,
          (SELECT COUNT(*) FROM attorneys WHERE is_active = true) as attorneys_count,
          (SELECT COUNT(*) FROM other_entities WHERE is_active = true) as other_entities_count
      `,
    ])

    const stats = transactionStats[0]
    const tasks = taskStats[0]
    const entities = entityCounts[0]

    // Calculate percentage changes (mock for now - would need historical data)
    const dashboardStats = {
      activeTransactions: {
        value: Number.parseInt(stats.active_count),
        change: "+12%", // Would calculate from historical data
        trend: "up",
      },
      totalVolume: {
        value: Number.parseFloat(stats.total_volume),
        change: "+8%", // Would calculate from historical data
        trend: "up",
      },
      pendingTasks: {
        value: Number.parseInt(tasks.pending_tasks),
        change: "-5%", // Would calculate from historical data
        trend: "down",
      },
      urgentItems: {
        value: Number.parseInt(tasks.urgent_items),
        change: "+2", // Would calculate from historical data
        trend: "up",
      },
      entityCounts: {
        clients: Number.parseInt(entities.clients_count),
        properties: Number.parseInt(entities.properties_count),
        agents: Number.parseInt(entities.agents_count),
        lenders: Number.parseInt(entities.lenders_count),
        attorneys: Number.parseInt(entities.attorneys_count),
        otherEntities: Number.parseInt(entities.other_entities_count || "0"),
      },
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard statistics" }, { status: 500 })
  }
}
