import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET /api/inspection-templates - List all email templates
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inspectionTypeId = searchParams.get("inspection_type_id")

    let templates

    if (inspectionTypeId) {
      templates = await sql`
        SELECT 
          t.*,
          it.name as inspection_type_name,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM inspection_email_templates t
        LEFT JOIN inspection_types it ON t.inspection_type_id = it.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.inspection_type_id = ${inspectionTypeId}::uuid OR t.inspection_type_id IS NULL
        ORDER BY t.is_default DESC, t.name
      `
    } else {
      templates = await sql`
        SELECT 
          t.*,
          it.name as inspection_type_name,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM inspection_email_templates t
        LEFT JOIN inspection_types it ON t.inspection_type_id = it.id
        LEFT JOIN users u ON t.created_by = u.id
        ORDER BY t.is_default DESC, t.name
      `
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

// POST /api/inspection-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only managers and admins can create templates
    if (auth.role !== "manager" && auth.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { name, subject, body: emailBody, inspection_type_id, is_default } = body

    if (!name || !subject || !emailBody) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await sql`
        UPDATE inspection_email_templates 
        SET is_default = false
        WHERE inspection_type_id IS NOT DISTINCT FROM ${inspection_type_id || null}::uuid
      `
    }

    const result = await sql`
      INSERT INTO inspection_email_templates (
        name, subject, body, inspection_type_id, is_default, created_by
      ) VALUES (
        ${name}, ${subject}, ${emailBody}, 
        ${inspection_type_id || null}::uuid, 
        ${is_default || false}, 
        ${auth.userId}::uuid
      )
      RETURNING *
    `

    return NextResponse.json({ template: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
