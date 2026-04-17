import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const followUpId = id

    const attachments = await sql`
      SELECT id, name, file_type, file_size, google_drive_url, google_drive_id, created_at, uploaded_by
      FROM documents
      WHERE task_id = ${followUpId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error("Error fetching attachments:", error)
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const followUpId = id
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // For now, store file metadata in the database
    // In production, you would upload to Google Drive or another storage service
    const result = await sql`
      INSERT INTO documents (
        name,
        file_type,
        file_size,
        task_id,
        uploaded_by,
        created_at,
        updated_at
      ) VALUES (
        ${file.name},
        ${file.type},
        ${file.size},
        ${followUpId},
        NULL,
        NOW(),
        NOW()
      )
      RETURNING id, name, file_type, file_size, created_at
    `

    return NextResponse.json({ attachment: result[0] })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
