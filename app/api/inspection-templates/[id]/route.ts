import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET /api/inspection-templates/[id] - Get a specific template
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const result = await sql`
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM inspection_email_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ${id}::uuid
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ template: result[0] })
  } catch (error) {
    console.error("Error fetching inspection template:", error)
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 })
  }
}

// PUT /api/inspection-templates/[id] - Update a template
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, subject, body: emailBody, is_default } = body

    if (!name || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await sql`
        UPDATE inspection_email_templates
        SET is_default = false
        WHERE id != ${id}::uuid
      `
    }

    const result = await sql`
      UPDATE inspection_email_templates
      SET 
        name = ${name},
        subject = ${subject},
        body = ${emailBody},
        is_default = ${is_default || false},
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ template: result[0] })
  } catch (error) {
    console.error("Error updating inspection template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

// DELETE /api/inspection-templates/[id] - Delete a template
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and managers can delete
    if (auth.role !== "admin" && auth.role !== "manager") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = await params

    const result = await sql`
      DELETE FROM inspection_email_templates
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting inspection template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
