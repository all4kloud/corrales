import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET - Get all active assistants (for assignment dropdown)
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only managers and admins can view assistants list
  if (auth.role !== "manager" && auth.role !== "admin") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  try {
    const assistants = await sql`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        COUNT(DISTINCT ta.transaction_id) as assigned_transactions_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN transaction_assignments ta ON ta.assigned_to_user_id = u.id
      WHERE r.name = 'assistant' AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
      ORDER BY u.first_name, u.last_name
    `

    return NextResponse.json({ assistants })
  } catch (error) {
    console.error("Error fetching assistants:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
