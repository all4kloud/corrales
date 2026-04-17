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
    const propertyType = searchParams.get("property_type")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let properties

    if (search && propertyType) {
      properties = await sql`
        SELECT * FROM properties 
        WHERE (address ILIKE ${`%${search}%`} OR city ILIKE ${`%${search}%`} OR mls_number ILIKE ${`%${search}%`})
        AND property_type = ${propertyType}
        AND is_active = true
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (search) {
      properties = await sql`
        SELECT * FROM properties 
        WHERE (address ILIKE ${`%${search}%`} OR city ILIKE ${`%${search}%`} OR mls_number ILIKE ${`%${search}%`})
        AND is_active = true
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (propertyType) {
      properties = await sql`
        SELECT * FROM properties 
        WHERE property_type = ${propertyType}
        AND is_active = true
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      properties = await sql`
        SELECT * FROM properties 
        WHERE is_active = true
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    console.log("[v0] Fetched properties:", properties.length)
    return NextResponse.json({ properties })
  } catch (error) {
    console.error("[v0] Error fetching properties:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
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

    console.log("[v0] Creating property with data:", data)

    const existingProperty = await sql`
      SELECT id, address, city, state 
      FROM properties 
      WHERE LOWER(address) = LOWER(${data.address})
        AND LOWER(city) = LOWER(${data.city})
        AND LOWER(state) = LOWER(${data.state})
        AND is_active = true
    `

    if (existingProperty.length > 0) {
      return NextResponse.json(
        {
          error: "Duplicate property",
          message: `A property already exists at ${data.address}, ${data.city}, ${data.state}`,
        },
        { status: 409 },
      )
    }

    const property = await sql`
      INSERT INTO properties (
        address, city, state, zip_code, property_type, bedrooms, bathrooms,
        square_feet, lot_size, year_built, listing_price, description
      ) VALUES (
        ${data.address}, ${data.city}, ${data.state}, ${data.zip_code},
        ${data.property_type}, ${data.bedrooms}, ${data.bathrooms},
        ${data.square_feet}, ${data.lot_size}, ${data.year_built},
        ${data.listing_price}, ${data.description}
      ) RETURNING *
    `

    console.log("[v0] Property created successfully:", property[0])
    return NextResponse.json({ property: property[0] })
  } catch (error) {
    console.error("[v0] Error creating property:", error)
    const err = error as { message?: string; code?: string }
    return NextResponse.json(
      {
        error: "Failed to create property",
        details: err.message ?? "Unknown error",
        sqlState: err.code ?? null,
      },
      { status: 500 },
    )
  }
}
