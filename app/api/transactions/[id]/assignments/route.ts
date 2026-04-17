import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET - Get all assistants assigned to a transaction
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const assignments = await sql`
      SELECT 
        ta.id,
        ta.transaction_id,
        ta.assigned_to_user_id,
        ta.assigned_at,
        ta.notes,
        u.first_name,
        u.last_name,
        u.email,
        assigner.first_name as assigned_by_first_name,
        assigner.last_name as assigned_by_last_name
      FROM transaction_assignments ta
      JOIN users u ON ta.assigned_to_user_id = u.id
      JOIN users assigner ON ta.assigned_by_user_id = assigner.id
      WHERE ta.transaction_id = ${id}::uuid
      ORDER BY ta.assigned_at DESC
    `

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("Error fetching transaction assignments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Assign an assistant to a transaction
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only managers can assign transactions
  if (auth.role !== "manager") {
    return NextResponse.json({ error: "Only managers can assign transactions" }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { assistantUserId, notes } = body

    if (!assistantUserId) {
      return NextResponse.json({ error: "Assistant user ID is required" }, { status: 400 })
    }

    // Verify the user being assigned is an assistant
    const assistantCheck = await sql`
      SELECT u.id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${assistantUserId}::uuid AND u.is_active = true
    `

    if (assistantCheck.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (assistantCheck[0].role_name !== "assistant") {
      return NextResponse.json({ error: "Can only assign transactions to assistants" }, { status: 400 })
    }

    // Create assignment (ON CONFLICT DO NOTHING handles duplicate assignments)
    const assignment = await sql`
      INSERT INTO transaction_assignments (
        transaction_id,
        assigned_to_user_id,
        assigned_by_user_id,
        notes
      ) VALUES (
        ${id}::uuid,
        ${assistantUserId}::uuid,
        ${auth.userId}::uuid,
        ${notes || null}
      )
      ON CONFLICT (transaction_id, assigned_to_user_id) DO UPDATE
      SET notes = ${notes || null}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    return NextResponse.json({ assignment: assignment[0] })
  } catch (error) {
    console.error("Error assigning transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove an assistant from a transaction
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only managers can remove assignments
  if (auth.role !== "manager") {
    return NextResponse.json({ error: "Only managers can remove assignments" }, { status: 403 })
  }

  const { id } = await params

  try {
    const { searchParams } = new URL(request.url)
    const assistantUserId = searchParams.get("assistantUserId")

    if (!assistantUserId) {
      return NextResponse.json({ error: "Assistant user ID is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM transaction_assignments
      WHERE transaction_id = ${id}::uuid
        AND assigned_to_user_id = ${assistantUserId}::uuid
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing transaction assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
