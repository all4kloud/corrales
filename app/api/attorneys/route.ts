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
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let attorneys

    if (search) {
      attorneys = await sql`
        SELECT a.*
        FROM attorneys a
        WHERE (a.firm_name ILIKE ${"%" + search + "%"} 
           OR a.attorney_name ILIKE ${"%" + search + "%"}
           OR a.email ILIKE ${"%" + search + "%"})
        AND a.is_active = true
        ORDER BY a.firm_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      attorneys = await sql`
        SELECT a.*
        FROM attorneys a
        WHERE a.is_active = true
        ORDER BY a.firm_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    
    // Get contacts separately for each attorney
    for (const attorney of attorneys) {
      const contacts = await sql`
        SELECT id, contact_name, email, phone, title as role, is_primary
        FROM entity_contacts
        WHERE entity_type = 'attorney' AND entity_id = ${attorney.id}::uuid
        ORDER BY is_primary DESC, contact_name ASC
      `
      attorney.contacts = contacts
    }

    return NextResponse.json({ attorneys })
  } catch (error) {
    console.error("[v0] Error fetching attorneys:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()
    console.log("[v0] Received attorney data:", JSON.stringify(data, null, 2))

    if (!data.firm_name || !data.attorney_name) {
      return NextResponse.json(
        {
          error: "Missing required fields: firm_name and attorney_name are required",
        },
        { status: 400 },
      )
    }

    if (data.firm_name.length > 255 || data.attorney_name.length > 255) {
      return NextResponse.json(
        {
          error: "Field too long: firm_name and attorney_name must be 255 characters or less",
        },
        { status: 400 },
      )
    }

    if (data.phone && data.phone.length > 20) {
      return NextResponse.json(
        {
          error: "Phone number too long: must be 20 characters or less",
        },
        { status: 400 },
      )
    }

    if (data.email && data.email.trim()) {
      const existingAttorney = await sql`
        SELECT id FROM attorneys 
        WHERE LOWER(email) = LOWER(${data.email.trim()}) 
        AND is_active = true
      `

      if (existingAttorney.length > 0) {
        return NextResponse.json({ error: "An attorney with this email already exists" }, { status: 409 })
      }
    }

    const specialtiesArray = Array.isArray(data.specialties) ? data.specialties : []
    const specialtiesFormatted = `{${specialtiesArray.map((s: string) => `"${s.replace(/"/g, '\\"')}"`).join(",")}}`
    console.log("[v0] Processing specialties:", specialtiesFormatted)

    const attorney = await sql`
      INSERT INTO attorneys (
        firm_name, attorney_name, email, phone, address, city, state, 
        zip_code, bar_number, specialties, website, notes
      ) VALUES (
        ${data.firm_name}, 
        ${data.attorney_name || null}, 
        ${data.email || null}, 
        ${data.phone || null},
        ${data.address || null}, 
        ${data.city || null}, 
        ${data.state || null}, 
        ${data.zip_code || null},
        ${data.bar_number || null}, 
        ${specialtiesFormatted}::text[], 
        ${data.website || null}, 
        ${data.notes || null}
      ) RETURNING *
    `

    // Create contacts if provided
    if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
      for (const contact of data.contacts) {
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
            ${attorney[0].id}::uuid,
            ${contact.contact_name}::varchar,
            ${contact.email || null}::varchar,
            ${contact.phone || null}::varchar,
            ${contact.role || null}::varchar,
            ${contact.is_primary || false}::boolean
          )
        `
      }
    }

    // Return attorney with contacts
    const result = await sql`
      SELECT 
        a.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ec.id,
            'contact_name', ec.contact_name,
            'email', ec.email,
            'phone', ec.phone,
            'role', ec.title,
            'is_primary', ec.is_primary
          ) ORDER BY ec.is_primary DESC, ec.contact_name)
          FROM entity_contacts ec 
          WHERE ec.entity_type = 'attorney' AND ec.entity_id = a.id),
          '[]'
        ) as contacts
      FROM attorneys a
      WHERE a.id = ${attorney[0].id}::uuid
    `

    console.log("[v0] Attorney created successfully:", result[0])
    return NextResponse.json({ attorney: result[0] })
  } catch (error) {
    console.error("[v0] Error creating attorney:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
