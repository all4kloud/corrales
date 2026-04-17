import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET /api/inspectors/[id] - Get inspector details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const inspectors = await sql`
      SELECT 
        i.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', isp.id,
              'inspection_type_id', it.id,
              'inspection_type_name', it.name,
              'typical_price', isp.typical_price,
              'notes', isp.notes
            )
          ) FILTER (WHERE it.id IS NOT NULL),
          '[]'
        ) as specialties
      FROM inspectors i
      LEFT JOIN inspector_specialties isp ON i.id = isp.inspector_id
      LEFT JOIN inspection_types it ON isp.inspection_type_id = it.id
      WHERE i.id = ${id}::uuid
      GROUP BY i.id
    `

    if (inspectors.length === 0) {
      return NextResponse.json({ error: "Inspector not found" }, { status: 404 })
    }

    return NextResponse.json({ inspector: inspectors[0] })
  } catch (error) {
    console.error("Error fetching inspector:", error)
    return NextResponse.json({ error: "Failed to fetch inspector" }, { status: 500 })
  }
}

// PUT /api/inspectors/[id] - Update inspector
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only managers and admins can update inspectors
    if (auth.role !== "manager" && auth.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      company_name,
      contact_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      license_number,
      website,
      notes,
      is_active,
      specialties,
      specialty_ids,
    } = body

    // Update inspector
    const result = await sql`
      UPDATE inspectors SET
        company_name = COALESCE(${company_name}, company_name),
        contact_name = COALESCE(${contact_name}, contact_name),
        email = COALESCE(${email}, email),
        phone = ${phone || null},
        address = ${address || null},
        city = ${city || null},
        state = ${state || null},
        zip = ${zip_code || null},
        license_number = ${license_number || null},
        website = ${website || null},
        notes = ${notes || null},
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Inspector not found" }, { status: 404 })
    }

    // Update specialties — accept either specialty_ids (simple id array) or specialties (object array)
    const idsToSave: string[] = specialty_ids && Array.isArray(specialty_ids)
      ? specialty_ids
      : specialties && Array.isArray(specialties)
        ? specialties.map((s: any) => s.inspection_type_id || s.id)
        : []

    if (idsToSave.length >= 0) {
      await sql`DELETE FROM inspector_specialties WHERE inspector_id = ${id}::uuid`

      for (const typeId of idsToSave) {
        if (!typeId) continue
        await sql`
          INSERT INTO inspector_specialties (inspector_id, inspection_type_id)
          VALUES (${id}::uuid, ${typeId}::uuid)
          ON CONFLICT DO NOTHING
        `
      }
    }

    return NextResponse.json({ inspector: result[0] })
  } catch (error) {
    console.error("Error updating inspector:", error)
    return NextResponse.json({ error: "Failed to update inspector" }, { status: 500 })
  }
}

// DELETE /api/inspectors/[id] - Delete inspector (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only managers and admins can delete inspectors
    if (auth.role !== "manager" && auth.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = await params

    const result = await sql`
      UPDATE inspectors 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Inspector not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Inspector deleted successfully" })
  } catch (error) {
    console.error("Error deleting inspector:", error)
    return NextResponse.json({ error: "Failed to delete inspector" }, { status: 500 })
  }
}
