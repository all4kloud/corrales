import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assigned_to") || auth.userId

    let tasks
    if (status) {
      tasks = await sql`
        SELECT 
          gt.*,
          u.first_name as assigned_user_first_name,
          u.last_name as assigned_user_last_name,
          creator.first_name as created_by_first_name,
          creator.last_name as created_by_last_name
        FROM general_tasks gt
        LEFT JOIN users u ON gt.assigned_to = u.id
        LEFT JOIN users creator ON gt.created_by = creator.id
        WHERE gt.assigned_to = ${assignedTo}::uuid
        AND gt.status = ${status}
        ORDER BY gt.due_date ASC NULLS LAST, gt.created_at DESC
      `
    } else {
      tasks = await sql`
        SELECT 
          gt.*,
          u.first_name as assigned_user_first_name,
          u.last_name as assigned_user_last_name,
          creator.first_name as created_by_first_name,
          creator.last_name as created_by_last_name
        FROM general_tasks gt
        LEFT JOIN users u ON gt.assigned_to = u.id
        LEFT JOIN users creator ON gt.created_by = creator.id
        WHERE gt.assigned_to = ${assignedTo}::uuid
        ORDER BY gt.due_date ASC NULLS LAST, gt.created_at DESC
      `
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching general tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, due_date, priority, assigned_to } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO general_tasks (
        title,
        description,
        due_date,
        priority,
        assigned_to,
        created_by,
        status
      ) VALUES (
        ${title},
        ${description || null},
        ${due_date || null},
        ${priority || "medium"},
        ${assigned_to || auth.userId}::uuid,
        ${auth.userId}::uuid,
        'pending'
      )
      RETURNING *
    `

    return NextResponse.json({ task: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating general task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
