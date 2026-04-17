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
    const search = searchParams.get("search")
    const entityType = searchParams.get("entity_type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let entities

    const searchCondition = search 
      ? sql`AND (oe.company_name ILIKE ${"%" + search + "%"} 
           OR oe.entity_type ILIKE ${"%" + search + "%"}
           OR EXISTS (
             SELECT 1 FROM entity_contacts ec 
             WHERE ec.entity_id = oe.id 
             AND (ec.contact_name ILIKE ${"%" + search + "%"} OR ec.email ILIKE ${"%" + search + "%"})
           ))`
      : sql``

    const typeCondition = entityType 
      ? sql`AND oe.entity_type = ${entityType}`
      : sql``

    entities = await sql`
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
      WHERE oe.is_active = true
      ${searchCondition}
      ${typeCondition}
      ORDER BY oe.company_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get distinct entity types for filtering
    const entityTypes = await sql`
      SELECT DISTINCT entity_type 
      FROM other_entities 
      WHERE is_active = true AND entity_type IS NOT NULL
      ORDER BY entity_type
    `

    return NextResponse.json({ 
      entities,
      entityTypes: entityTypes.map(t => t.entity_type)
    })
  } catch (error) {
    console.error("Error fetching other entities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()

    if (!data.company_name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const entity = await sql`
      INSERT INTO other_entities (
        company_name, 
        entity_type,
        address, 
        city,
        state,
        zip_code,
        website,
        notes
      ) VALUES (
        ${data.company_name}::varchar, 
        ${data.entity_type || null}::varchar,
        ${data.address || null}::text,
        ${data.city || null}::varchar,
        ${data.state || null}::varchar,
        ${data.zip_code || null}::varchar,
        ${data.website || null}::varchar,
        ${data.notes || null}::text
      ) RETURNING *
    `

    // Create contacts if provided
    if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
      for (const contact of data.contacts) {
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
              ${entity[0].id}::uuid,
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

    // Return entity with contacts
    const result = await sql`
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
      WHERE oe.id = ${entity[0].id}::uuid
    `

    return NextResponse.json({ entity: result[0] })
  } catch (error) {
    console.error("Error creating other entity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
