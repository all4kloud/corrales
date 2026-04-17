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

    let lenders

    if (search) {
      lenders = await sql`
        SELECT l.*
        FROM lenders l
        WHERE (l.company_name ILIKE ${"%" + search + "%"} 
           OR l.contact_name ILIKE ${"%" + search + "%"}
           OR l.email ILIKE ${"%" + search + "%"})
        AND l.is_active = true
        ORDER BY l.company_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      lenders = await sql`
        SELECT l.*
        FROM lenders l
        WHERE l.is_active = true
        ORDER BY l.company_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    
    // Get contacts separately for each lender
    for (const lender of lenders) {
      const contacts = await sql`
        SELECT id, contact_name, email, phone, title as role, is_primary
        FROM entity_contacts
        WHERE entity_type = 'lender' AND entity_id = ${lender.id}::uuid
        ORDER BY is_primary DESC, contact_name ASC
      `
      lender.contacts = contacts
    }

    return NextResponse.json({ lenders })
  } catch (error) {
    console.error("[v0] Error fetching lenders:", error)
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

    if (data.email) {
      const existingLender = await sql`
        SELECT id FROM lenders 
        WHERE LOWER(email) = LOWER(${data.email})
        AND is_active = true
        LIMIT 1
      `

      if (existingLender.length > 0) {
        return NextResponse.json({ error: "A lender with this email address already exists" }, { status: 409 })
      }
    }

    const lender = await sql`
      INSERT INTO lenders (
        company_name, 
        contact_name, 
        email, 
        phone, 
        address, 
        loan_types,
        notes
      ) VALUES (
        ${data.company_name}::varchar, 
        ${data.contact_name || null}::varchar, 
        ${data.email || null}::varchar, 
        ${data.phone || null}::varchar,
        ${data.address || null}::text,
        ${data.loan_types || []}::varchar[],
        ${data.notes || null}::text
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
            'lender',
            ${lender[0].id}::uuid,
            ${contact.contact_name}::varchar,
            ${contact.email || null}::varchar,
            ${contact.phone || null}::varchar,
            ${contact.role || null}::varchar,
            ${contact.is_primary || false}::boolean
          )
        `
      }
    }

    // Return lender with contacts
    const result = await sql`
      SELECT 
        l.*,
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
          WHERE ec.entity_type = 'lender' AND ec.entity_id = l.id),
          '[]'
        ) as contacts
      FROM lenders l
      WHERE l.id = ${lender[0].id}::uuid
    `

    return NextResponse.json({ lender: result[0] })
  } catch (error) {
    console.error("Error creating lender:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
