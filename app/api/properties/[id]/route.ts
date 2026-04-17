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

  const { id } = await params

  try {
    const properties = await sql`
      SELECT * FROM properties WHERE id = ${id} AND is_active = true
    `

    if (properties.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ property: properties[0] })
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    const existingProperty = await sql`
      SELECT id, address, city, state 
      FROM properties 
      WHERE LOWER(address) = LOWER(${data.address})
        AND LOWER(city) = LOWER(${data.city})
        AND LOWER(state) = LOWER(${data.state})
        AND is_active = true
        AND id != ${id}
    `

    if (existingProperty.length > 0) {
      return NextResponse.json(
        {
          error: "Duplicate property",
          message: `Another property already exists at ${data.address}, ${data.city}, ${data.state}`,
        },
        { status: 409 },
      )
    }

    const property = await sql`
      UPDATE properties SET
        address = ${data.address},
        city = ${data.city},
        state = ${data.state},
        zip_code = ${data.zip_code},
        property_type = ${data.property_type},
        bedrooms = ${data.bedrooms},
        bathrooms = ${data.bathrooms},
        square_feet = ${data.square_feet},
        lot_size = ${data.lot_size},
        year_built = ${data.year_built},
        listing_price = ${data.listing_price},
        market_value = ${data.market_value},
        mls_number = ${data.mls_number},
        description = ${data.description},
        features = ${data.features},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (property.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ property: property[0] })
  } catch (error) {
    console.error("Error updating property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const result = await sql`
      UPDATE properties 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Property deleted successfully" })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
