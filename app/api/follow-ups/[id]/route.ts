import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import { notifyTaskCompletion } from "@/lib/notifications"

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const followUp = await sql`
      SELECT 
        fe.id,
        fe.transaction_id,
        fe.template_id,
        fe.event_name,
        fe.description,
        fe.due_date,
        fe.priority,
        fe.status,
        fe.assigned_to,
        fe.completed_at,
        fe.notes,
        fe.created_at,
        fe.updated_at,
        t.transaction_type,
        p.address as property_address,
        p.city as property_city,
        p.state as property_state,
        p.zip_code as property_zip,
        u.first_name as assigned_first_name,
        u.last_name as assigned_last_name,
        COALESCE(fet.is_inspection_related, false) as is_inspection_related,
        COALESCE(fe.related_entity_type, fet.related_entity_type) as related_entity_type,
        it.name as inspection_type_name,
        it.id as inspection_type_id,
        cb.first_name || ' ' || cb.last_name as buyer_first_name,
        cs.first_name || ' ' || cs.last_name as seller_first_name,
        cb.email as buyer_email,
        cb.phone as buyer_phone,
        cs.email as seller_email,
        cs.phone as seller_phone
      FROM follow_up_events fe
      LEFT JOIN transactions t ON fe.transaction_id = t.id
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN users u ON fe.assigned_to = u.id
      LEFT JOIN follow_up_event_templates fet ON fe.template_id = fet.id
      LEFT JOIN inspection_types it ON fet.default_inspection_type_id = it.id
      LEFT JOIN customers cb ON t.buyer_id = cb.id
      LEFT JOIN customers cs ON t.seller_id = cs.id
      WHERE fe.id = ${id}
    `

    if (followUp.length === 0) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })
    }

    return NextResponse.json({ followUp: followUp[0] })
  } catch (error) {
    console.error("Error fetching follow-up:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    const updateFields: any = {}

    if (data.event_name !== undefined) updateFields.event_name = data.event_name
    if (data.description !== undefined) updateFields.description = data.description
    if (data.due_date !== undefined) updateFields.due_date = data.due_date
    if (data.priority !== undefined) updateFields.priority = data.priority
    if (data.notes !== undefined) updateFields.notes = data.notes

    if (data.assigned_to !== undefined) {
      updateFields.assigned_to = data.assigned_to === "" ? null : data.assigned_to
    }

    if (data.transaction_id !== undefined) {
      updateFields.transaction_id = data.transaction_id === "" ? null : data.transaction_id
    }

    // Track if status is changing to completed for notifications
    const isCompletingTask = data.status === "completed"

    if (data.status !== undefined) {
      updateFields.status = data.status
      if (data.status === "completed") {
        updateFields.completed_at = new Date()
      } else {
        updateFields.completed_at = null
      }
    }

    const result = await sql`
      UPDATE follow_up_events 
      SET 
        event_name = COALESCE(${updateFields.event_name || null}, event_name),
        description = COALESCE(${updateFields.description || null}, description),
        due_date = COALESCE(${updateFields.due_date || null}::date, due_date),
        priority = COALESCE(${updateFields.priority || null}, priority),
        status = COALESCE(${updateFields.status || null}, status),
        assigned_to = CASE WHEN ${updateFields.assigned_to !== undefined} THEN ${updateFields.assigned_to || null}::uuid ELSE assigned_to END,
        completed_at = CASE WHEN ${updateFields.completed_at !== undefined} THEN ${updateFields.completed_at || null}::timestamp ELSE completed_at END,
        notes = COALESCE(${updateFields.notes || null}, notes),
        transaction_id = CASE WHEN ${updateFields.transaction_id !== undefined} THEN ${updateFields.transaction_id || null}::uuid ELSE transaction_id END,
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING 
        id,
        transaction_id,
        template_id,
        event_name,
        description,
        due_date,
        priority,
        status,
        assigned_to,
        completed_at,
        notes,
        created_at,
        updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })
    }

    const followUp = {
      ...result[0],
      due_date: result[0].due_date ? new Date(result[0].due_date).toISOString().split("T")[0] : null,
      completed_at: result[0].completed_at ? new Date(result[0].completed_at).toISOString() : null,
      created_at: result[0].created_at ? new Date(result[0].created_at).toISOString() : null,
      updated_at: result[0].updated_at ? new Date(result[0].updated_at).toISOString() : null,
    }

    // Send notifications if task was just completed
    if (isCompletingTask && result[0].transaction_id) {
      try {
        // Get customer emails and IDs for this transaction
        const customers = await sql`
          SELECT DISTINCT c.id, c.email
          FROM customers c
          WHERE c.id IN (
            SELECT customer_id FROM transaction_buyers WHERE transaction_id = ${result[0].transaction_id}::uuid
            UNION
            SELECT customer_id FROM transaction_sellers WHERE transaction_id = ${result[0].transaction_id}::uuid
          )
        `

        // Get property address
        const property = await sql`
          SELECT p.address
          FROM transactions t
          LEFT JOIN properties p ON t.property_id = p.id
          WHERE t.id = ${result[0].transaction_id}::uuid
        `

        if (customers.length > 0) {
          await notifyTaskCompletion({
            taskId: id,
            taskName: result[0].event_name,
            transactionId: result[0].transaction_id,
            customerEmails: customers.map((c: any) => c.email),
            customerIds: customers.map((c: any) => c.id),
            propertyAddress: property[0]?.address,
          })
        }
      } catch (notificationError) {
        console.error("[v0] Failed to send notifications:", notificationError)
        // Don't fail the request if notifications fail
      }
    }

    // Auto-close transaction if all tasks are completed or not_applicable
    if ((data.status === "completed" || data.status === "not_applicable") && result[0].transaction_id) {
      const transactionId = result[0].transaction_id
      
      // Check if all tasks for this transaction are completed or not_applicable
      const taskStats = await sql`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status IN ('completed', 'not_applicable') THEN 1 END) as done_tasks
        FROM follow_up_events 
        WHERE transaction_id = ${transactionId}::uuid
      `
      
      const totalTasks = Number(taskStats[0]?.total_tasks || 0)
      const doneTasks = Number(taskStats[0]?.done_tasks || 0)
      
      // If all tasks are completed or not_applicable (and there's at least one task), auto-close the transaction
      if (totalTasks > 0 && totalTasks === doneTasks) {
        await sql`
          UPDATE transactions 
          SET status = 'closed', updated_at = NOW() 
          WHERE id = ${transactionId}::uuid 
          AND status != 'closed'
        `
        
        return NextResponse.json({
          ...followUp,
          transaction_auto_closed: true,
          message: "All tasks completed or marked as not applicable. Transaction has been automatically closed."
        })
      }
    }

    return NextResponse.json(followUp)
  } catch (error) {
    console.error("Error updating follow-up:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PUT(request, { params })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    await sql`DELETE FROM follow_up_events WHERE id = ${id}::uuid`
    return NextResponse.json({ message: "Follow-up deleted successfully" })
  } catch (error) {
    console.error("Error deleting follow-up:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
