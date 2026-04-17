import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { generateTemporaryPassword } from "@/lib/generate-password"

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

    let clients
    if (search) {
      const searchTerm = `%${search}%`
      clients = await sql`
        SELECT 
          c.id, 
          c.first_name, 
          COALESCE(c.middle_name::text, '') as middle_name,
          c.last_name, 
          c.email, 
          c.phone, 
          c.address, 
          c.city, 
          c.state, 
          c.zip_code,
          c.country,
          c.visa_type,
          c.language,
          c.notes,
          c.is_active,
          c.created_at,
          c.updated_at,
          c.portal_access_enabled,
          c.user_id
        FROM customers c
        WHERE (c.first_name ILIKE ${searchTerm} OR c.last_name ILIKE ${searchTerm} OR c.email ILIKE ${searchTerm})
        AND c.is_active = true
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      clients = await sql`
        SELECT 
          c.id, 
          c.first_name, 
          COALESCE(c.middle_name::text, '') as middle_name,
          c.last_name, 
          c.email, 
          c.phone, 
          c.address, 
          c.city, 
          c.state, 
          c.zip_code,
          c.country,
          c.visa_type,
          c.language,
          c.notes,
          c.is_active,
          c.created_at,
          c.updated_at,
          c.portal_access_enabled,
          c.user_id
        FROM customers c
        WHERE c.is_active = true
        ORDER BY c.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
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

    const existingClient = await sql`
      SELECT id, email FROM customers 
      WHERE LOWER(email) = LOWER(${data.email})
      AND is_active = true
    `

    if (existingClient.length > 0) {
      return NextResponse.json({ error: "A client with this email address already exists." }, { status: 409 })
    }

    const enablePortalAccess = data.enable_portal_access === true

    let userId = null
    let temporaryPassword = null

    // If portal access is enabled, create user account
    if (enablePortalAccess) {
      // Check if user with this email already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${data.email}
      `

      if (existingUser.length > 0) {
        // Use existing user
        userId = existingUser[0].id
      } else {
        // Get customer role
        const customerRole = await sql`
          SELECT id FROM roles WHERE name = 'customer'
        `

        if (customerRole.length === 0) {
          return NextResponse.json(
            { error: "Customer role not found. Please run the database migrations." },
            { status: 400 },
          )
        }

        // Generate temporary password
        temporaryPassword = generateTemporaryPassword()
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

        // Create user account
        const newUser = await sql`
          INSERT INTO users (
            email, password_hash, first_name, middle_name, last_name, phone, role_id, is_active
          ) VALUES (
            ${data.email}, ${hashedPassword}, ${data.first_name}, ${data.middle_name || null}, 
            ${data.last_name}, ${data.phone}, ${customerRole[0].id}, true
          ) RETURNING id
        `
        userId = newUser[0].id
      }
    }

    // Create customer record
    const client = await sql`
      INSERT INTO customers (
        first_name, middle_name, last_name, email, phone, address, city, state, zip_code, 
        country, visa_type, language, notes, user_id, portal_access_enabled
      ) VALUES (
        ${data.first_name}, ${data.middle_name || null}, ${data.last_name}, ${data.email}, ${data.phone},
        ${data.address}, ${data.city}, ${data.state}, ${data.zip_code}, ${data.country || "United States"}, 
        ${data.visa_type || null}, ${data.language || "English"}, ${data.notes}, ${userId}, ${enablePortalAccess}
      ) RETURNING *
    `

    // Return response with temporary password if created
    const response: any = { client: client[0] }
    if (temporaryPassword) {
      response.portal_credentials = {
        email: data.email,
        temporary_password: temporaryPassword,
        login_url: "/portal/login",
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
