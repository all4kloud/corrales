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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    const entity = await sql`
      SELECT 
        oe.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ec.id,
            'contact_name', ec.contact_name,
            'email', ec.email,
            'phone', ec.phone,
            'title', ec.title,
            'is_primary', ec.is_primary
          ) ORDER BY ec.is_primary DESC, ec.contact_name)
          FROM entity_contacts ec 
          WHERE ec.entity_id = oe.id),
          '[]'
        ) as contacts
      FROM other_entities oe
      WHERE oe.id = ${id}::uuid AND oe.is_active = true
    `

    if (entity.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    return NextResponse.json({ entity: entity[0] })
  } catch (error) {
    console.error("Error fetching other entity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    const {
      company_name,
      entity_type,
      address,
      city,
      state,
      zip_code,
      website,
      notes,
      contacts,
    } = body

    if (!company_name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE other_entities 
      SET 
        company_name = ${company_name},
        entity_type = ${entity_type || null},
        address = ${address || null},
        city = ${city || null},
        state = ${state || null},
        zip_code = ${zip_code || null},
        website = ${website || null},
        notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    // Handle contacts update if provided
    if (contacts && Array.isArray(contacts)) {
      // Delete existing contacts
      await sql`DELETE FROM entity_contacts WHERE entity_id = ${id}::uuid`
      
      // Insert new contacts
      for (const contact of contacts) {
        if (contact.contact_name) {
          await sql`
            INSERT INTO entity_contacts (
              entity_type,
              entity_id,
              contact_name,
              email,
              phone,
              title,
              is_primary
            ) VALUES (
              'other',
              ${id}::uuid,
              ${contact.contact_name}::varchar,
              ${contact.email || null}::varchar,
              ${contact.phone || null}::varchar,
              ${contact.title || null}::varchar,
              ${contact.is_primary || false}::boolean
            )
          `
        }
      }
    }

    // Return updated entity with contacts
    const updatedEntity = await sql`
      SELECT 
        oe.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ec.id,
            'contact_name', ec.contact_name,
            'email', ec.email,
            'phone', ec.phone,
            'title', ec.title,
            'is_primary', ec.is_primary
          ) ORDER BY ec.is_primary DESC, ec.contact_name)
          FROM entity_contacts ec 
          WHERE ec.entity_id = oe.id),
          '[]'
        ) as contacts
      FROM other_entities oe
      WHERE oe.id = ${id}::uuid
    `

    return NextResponse.json({
      message: "Entity updated successfully",
      entity: updatedEntity[0],
    })
  } catch (error) {
    console.error("Error updating other entity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params

    // Also delete associated contacts
    await sql`DELETE FROM entity_contacts WHERE entity_id = ${id}::uuid`

    const result = await sql`
      UPDATE other_entities 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Entity deleted successfully" })
  } catch (error) {
    console.error("Error deleting other entity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
