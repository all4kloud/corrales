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
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("task_id")
    const transactionId = searchParams.get("transaction_id")

    let documents
    if (taskId) {
      documents = await sql`
        SELECT 
          d.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name,
          dt.name as document_type_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN document_types dt ON d.document_type_id = dt.id
        WHERE d.task_id = ${taskId}
        ORDER BY d.created_at DESC
      `
    } else if (transactionId) {
      documents = await sql`
        SELECT 
          d.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name,
          dt.name as document_type_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN document_types dt ON d.document_type_id = dt.id
        WHERE d.transaction_id = ${transactionId}
        ORDER BY d.created_at DESC
      `
    } else {
      documents = await sql`
        SELECT 
          d.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name,
          dt.name as document_type_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN document_types dt ON d.document_type_id = dt.id
        ORDER BY d.created_at DESC
        LIMIT 50
      `
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      name,
      file_type,
      file_size,
      google_drive_id,
      google_drive_url,
      task_id,
      transaction_id,
      document_type_id,
    } = body

    // Validate required fields
    if (!name || !google_drive_id || !google_drive_url) {
      return NextResponse.json(
        { error: "Missing required fields: name, google_drive_id, google_drive_url" },
        { status: 400 }
      )
    }

    // Insert document into database
    const result = await sql`
      INSERT INTO documents (
        name,
        file_type,
        file_size,
        google_drive_id,
        google_drive_url,
        task_id,
        transaction_id,
        document_type_id,
        uploaded_by
      ) VALUES (
        ${name},
        ${file_type || null},
        ${file_size || null},
        ${google_drive_id},
        ${google_drive_url},
        ${task_id || null}::uuid,
        ${transaction_id || null}::uuid,
        ${document_type_id || null}::integer,
        ${auth.userId as string}::uuid
      )
      RETURNING *
    `

    console.log("[v0] Document registered in database:", result[0].id)

    return NextResponse.json({ document: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error registering document:", error)
    return NextResponse.json(
      { error: "Failed to register document", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
