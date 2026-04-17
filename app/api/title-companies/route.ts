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

    let titleCompanies
    if (search) {
      const searchTerm = `%${search}%`
      titleCompanies = await sql`
        SELECT * FROM title_companies 
        WHERE (company_name ILIKE ${searchTerm} OR contact_name ILIKE ${searchTerm} OR email ILIKE ${searchTerm})
        AND is_active = true
        ORDER BY company_name ASC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      titleCompanies = await sql`
        SELECT * FROM title_companies 
        WHERE is_active = true
        ORDER BY company_name ASC 
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({ titleCompanies })
  } catch (error) {
    console.error("Error fetching title companies:", error)
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

    const existingTitleCompany = await sql`
      SELECT id FROM title_companies 
      WHERE LOWER(email) = LOWER(${data.email})
      AND is_active = true
    `

    if (existingTitleCompany.length > 0) {
      return NextResponse.json({ error: "A title company with this email already exists" }, { status: 409 })
    }

    const titleCompany = await sql`
      INSERT INTO title_companies (
        company_name, contact_name, email, phone, address, city, state, zip_code, fax, website, notes
      ) VALUES (
        ${data.company_name}, ${data.contact_name}, ${data.email}, ${data.phone},
        ${data.address}, ${data.city}, ${data.state}, ${data.zip_code}, 
        ${data.fax}, ${data.website}, ${data.notes}
      ) RETURNING *
    `

    return NextResponse.json({ titleCompany: titleCompany[0] })
  } catch (error) {
    console.error("Error creating title company:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
