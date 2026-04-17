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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const clients = await sql`
      SELECT c.* 
      FROM customers c 
      WHERE c.id = ${id}
    `

    if (clients.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ client: clients[0] })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
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

    const duplicateClient = await sql`
      SELECT id, email FROM customers 
      WHERE LOWER(email) = LOWER(${data.email})
      AND id != ${id}
      AND is_active = true
    `

    if (duplicateClient.length > 0) {
      return NextResponse.json({ error: "Another client with this email address already exists." }, { status: 409 })
    }

    const enablePortalAccess = data.enable_portal_access === true

    const existingClient = await sql`
      SELECT user_id, email FROM customers WHERE id = ${id}
    `

    if (existingClient.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    let userId = existingClient[0].user_id
    let temporaryPassword = null

    if (enablePortalAccess && !userId) {
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${data.email}
      `

      if (existingUser.length > 0) {
        userId = existingUser[0].id
      } else {
        const customerRole = await sql`
          SELECT id FROM roles WHERE name = 'customer'
        `

        if (customerRole.length === 0) {
          return NextResponse.json(
            { error: "Customer role not found. Please run the database migrations." },
            { status: 400 },
          )
        }

        temporaryPassword = generateTemporaryPassword()
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10)

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
    } else if (!enablePortalAccess && userId) {
      await sql`
        UPDATE users SET is_active = false WHERE id = ${userId}
      `
    } else if (enablePortalAccess && userId) {
      await sql`
        UPDATE users SET is_active = true WHERE id = ${userId}
      `
    }

    const client = await sql`
      UPDATE customers SET
        first_name = ${data.first_name},
        middle_name = ${data.middle_name || null},
        last_name = ${data.last_name},
        email = ${data.email},
        phone = ${data.phone},
        address = ${data.address},
        city = ${data.city},
        state = ${data.state},
        zip_code = ${data.zip_code},
        country = ${data.country || "United States"},
        visa_type = ${data.visa_type || null},
        language = ${data.language || "English"},
        notes = ${data.notes},
        user_id = ${userId},
        portal_access_enabled = ${enablePortalAccess},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

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
    console.error("Error updating client:", error)
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
      UPDATE customers 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Client deleted successfully" })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
