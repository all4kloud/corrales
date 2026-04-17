import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { title, description, due_date, priority, status, assigned_to } = body

    const result = await sql`
      UPDATE general_tasks
      SET
        title        = COALESCE(${title ?? null}, title),
        description  = COALESCE(${description ?? null}, description),
        due_date     = CASE WHEN ${due_date !== undefined} THEN ${due_date ?? null}::timestamp ELSE due_date END,
        priority     = COALESCE(${priority ?? null}, priority),
        status       = COALESCE(${status ?? null}, status),
        assigned_to  = CASE WHEN ${assigned_to !== undefined} THEN ${assigned_to ?? null}::uuid ELSE assigned_to END,
        updated_at   = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ task: result[0] })
  } catch (error) {
    console.error("Error updating general task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {

    const result = await sql`
      DELETE FROM general_tasks
      WHERE id = ${id}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting general task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
