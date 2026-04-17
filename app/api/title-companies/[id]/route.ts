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
    const titleCompanies = await sql`
      SELECT * FROM title_companies WHERE id = ${id}
    `

    if (titleCompanies.length === 0) {
      return NextResponse.json({ error: "Title company not found" }, { status: 404 })
    }

    return NextResponse.json({ titleCompany: titleCompanies[0] })
  } catch (error) {
    console.error("Error fetching title company:", error)
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

    const existingTitleCompany = await sql`
      SELECT id FROM title_companies 
      WHERE LOWER(email) = LOWER(${data.email})
      AND id != ${id}
      AND is_active = true
    `

    if (existingTitleCompany.length > 0) {
      return NextResponse.json({ error: "Another title company with this email already exists" }, { status: 409 })
    }

    const titleCompany = await sql`
      UPDATE title_companies SET
        company_name = ${data.company_name},
        contact_name = ${data.contact_name},
        email = ${data.email},
        phone = ${data.phone},
        address = ${data.address},
        city = ${data.city},
        state = ${data.state},
        zip_code = ${data.zip_code},
        fax = ${data.fax},
        website = ${data.website},
        notes = ${data.notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (titleCompany.length === 0) {
      return NextResponse.json({ error: "Title company not found" }, { status: 404 })
    }

    return NextResponse.json({ titleCompany: titleCompany[0] })
  } catch (error) {
    console.error("Error updating title company:", error)
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
      UPDATE title_companies 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Title company not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Title company deleted successfully" })
  } catch (error) {
    console.error("Error deleting title company:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
