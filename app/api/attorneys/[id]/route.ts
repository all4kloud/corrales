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

    const attorney = await sql`
      SELECT 
        a.*,
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
          WHERE ec.entity_type = 'attorney' AND ec.entity_id = a.id),
          '[]'
        ) as contacts
      FROM attorneys a
      WHERE a.id = ${id}::uuid AND a.is_active = true
    `

    if (attorney.length === 0) {
      return NextResponse.json({ error: "Attorney not found" }, { status: 404 })
    }

    return NextResponse.json({ attorney: attorney[0] })
  } catch (error) {
    console.error("Error fetching attorney:", error)
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
      firm_name,
      attorney_name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      bar_number,
      specialties,
      website,
      notes,
      contacts,
    } = body

    if (!firm_name?.trim()) {
      return NextResponse.json({ error: "Firm name is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE attorneys 
      SET 
        firm_name = ${firm_name},
        attorney_name = ${attorney_name || null},
        email = ${email || null},
        phone = ${phone || null},
        address = ${address || null},
        city = ${city || null},
        state = ${state || null},
        zip_code = ${zip_code || null},
        bar_number = ${bar_number || null},
        specialties = ${specialties || []}::varchar[],
        website = ${website || null},
        notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Attorney not found" }, { status: 404 })
    }

    // Handle contacts update if provided
    if (contacts && Array.isArray(contacts)) {
      // Delete existing contacts
      await sql`DELETE FROM entity_contacts WHERE entity_type = 'attorney' AND entity_id = ${id}::uuid`
      
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
              'attorney',
              ${id}::uuid,
              ${contact.contact_name}::varchar,
              ${contact.email || null}::varchar,
              ${contact.phone || null}::varchar,
              ${contact.title || contact.role || null}::varchar,
              ${contact.is_primary || false}::boolean
            )
          `
        }
      }
    }

    // Return updated attorney with contacts
    const updatedAttorney = await sql`
      SELECT 
        a.*,
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
          WHERE ec.entity_type = 'attorney' AND ec.entity_id = a.id),
          '[]'
        ) as contacts
      FROM attorneys a
      WHERE a.id = ${id}::uuid
    `

    return NextResponse.json({
      message: "Attorney updated successfully",
      attorney: updatedAttorney[0],
    })
  } catch (error) {
    console.error("Error updating attorney:", error)
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

    const result = await sql`
      UPDATE attorneys 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Attorney not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Attorney deleted successfully" })
  } catch (error) {
    console.error("Error deleting attorney:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
