import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET /api/inspectors - List all active inspectors
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inspectionTypeId = searchParams.get("inspection_type_id")
    const activeOnly = searchParams.get("active_only") !== "false"

    let inspectors

    if (inspectionTypeId) {
      // Get inspectors for a specific inspection type
      inspectors = await sql`
        SELECT DISTINCT
          i.*,
          json_agg(json_build_object(
            'inspection_type_id', it.id,
            'inspection_type_name', it.name,
            'typical_price', isp.typical_price,
            'notes', isp.notes
          )) as specialties
        FROM inspectors i
        INNER JOIN inspector_specialties isp ON i.id = isp.inspector_id
        INNER JOIN inspection_types it ON isp.inspection_type_id = it.id
        WHERE it.id = ${inspectionTypeId}::uuid
          ${activeOnly ? sql`AND i.is_active = true` : sql``}
        GROUP BY i.id
        ORDER BY i.company_name
      `
    } else {
      // Get all inspectors with their specialties
      inspectors = await sql`
        SELECT 
          i.*,
          COALESCE(
            json_agg(
              json_build_object(
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
        ${activeOnly ? sql`WHERE i.is_active = true` : sql``}
        GROUP BY i.id
        ORDER BY i.company_name
      `
    }

    return NextResponse.json({ inspectors })
  } catch (error) {
    console.error("Error fetching inspectors:", error)
    return NextResponse.json({ error: "Failed to fetch inspectors" }, { status: 500 })
  }
}

// POST /api/inspectors - Create new inspector
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only managers and admins can create inspectors
    if (auth.role !== "manager" && auth.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const {
      company_name,
      contact_name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      website,
      notes,
      specialties, // Array of { inspection_type_id, typical_price, notes }
    } = body

    if (!company_name || !contact_name || !email) {
      return NextResponse.json(
        { error: "Company name, contact name, and email are required" },
        { status: 400 }
      )
    }

    // Insert inspector
    const result = await sql`
      INSERT INTO inspectors (
        company_name, contact_name, email, phone, address, city, state, zip, website, notes
      ) VALUES (
        ${company_name}, ${contact_name}, ${email}, ${phone || null}, 
        ${address || null}, ${city || null}, ${state || null}, ${zip || null}, 
        ${website || null}, ${notes || null}
      )
      RETURNING *
    `

    const inspector = result[0]

    // Insert specialties if provided
    if (specialties && Array.isArray(specialties) && specialties.length > 0) {
      for (const specialty of specialties) {
        await sql`
          INSERT INTO inspector_specialties (
            inspector_id, inspection_type_id, typical_price, notes
          ) VALUES (
            ${inspector.id}::uuid, 
            ${specialty.inspection_type_id}::uuid, 
            ${specialty.typical_price || null}, 
            ${specialty.notes || null}
          )
        `
      }
    }

    return NextResponse.json({ inspector }, { status: 201 })
  } catch (error) {
    console.error("Error creating inspector:", error)
    return NextResponse.json({ error: "Failed to create inspector" }, { status: 500 })
  }
}
