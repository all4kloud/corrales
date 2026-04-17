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

    let agents
    if (search) {
      agents = await sql`
        SELECT 
          a.*,
          u.first_name,
          COALESCE(u.middle_name::text, '') as middle_name,
          u.last_name,
          u.email,
          u.phone,
          COUNT(t.id) as active_transactions
        FROM agents a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN transactions t ON (a.id = t.listing_agent_id OR a.id = t.buyer_agent_id) 
          AND t.status NOT IN ('closed', 'cancelled') AND t.is_active = true
        WHERE (u.first_name ILIKE ${`%${search}%`} OR u.last_name ILIKE ${`%${search}%`} OR a.license_number ILIKE ${`%${search}%`})
        AND a.is_active = true
        GROUP BY a.id, u.id 
        ORDER BY u.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      agents = await sql`
        SELECT 
          a.*,
          u.first_name,
          COALESCE(u.middle_name::text, '') as middle_name,
          u.last_name,
          u.email,
          u.phone,
          COUNT(t.id) as active_transactions
        FROM agents a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN transactions t ON (a.id = t.listing_agent_id OR a.id = t.buyer_agent_id) 
          AND t.status NOT IN ('closed', 'cancelled') AND t.is_active = true
        WHERE a.is_active = true
        GROUP BY a.id, u.id 
        ORDER BY u.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error("Error fetching agents:", error)
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
    console.log("[v0] Creating agent with data:", data)

    const existingUser = await sql`
      SELECT u.id, u.email, a.id as agent_id, a.is_active
      FROM users u
      LEFT JOIN agents a ON a.user_id = u.id
      WHERE LOWER(u.email) = LOWER(${data.email})
      LIMIT 1
    `

    if (existingUser.length > 0) {
      // If user exists and already has an active agent record, return conflict
      if (existingUser[0].agent_id && existingUser[0].is_active) {
        return NextResponse.json(
          {
            error: "Duplicate email",
            details: "An agent with this email address already exists",
          },
          { status: 409 },
        )
      }
      // User exists but no active agent, use existing user
      const user = existingUser
      console.log("[v0] Using existing user:", user[0].id)

      // Create the agent record for existing user
      const specialtiesArray = data.specialties ? [data.specialties] : []

      const agent = await sql`
        INSERT INTO agents (
          user_id, license_number, brokerage, commission_rate, specialties, bio
        ) VALUES (
          ${user[0].id}, ${data.license_number}, ${data.brokerage}, 
          ${data.commission_rate}, ${specialtiesArray}, ${data.bio || ""}
        ) RETURNING *
      `

      return NextResponse.json({
        agent: {
          ...agent[0],
          first_name: data.first_name,
          middle_name: data.middle_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
        },
      })
    }

    // Create new user with middle_name support
    const user = await sql`
      INSERT INTO users (
        first_name, middle_name, last_name, email, phone, role_id, password_hash
      ) VALUES (
        ${data.first_name}, ${data.middle_name || null}, ${data.last_name}, 
        ${data.email}, ${data.phone}, 2, 'temp_hash'
      ) RETURNING *
    `
    console.log("[v0] Created new user:", user[0].id)

    // Check if agent already exists for this user
    const existingAgent = await sql`
      SELECT * FROM agents WHERE user_id = ${user[0].id} AND is_active = true LIMIT 1
    `

    if (existingAgent.length > 0) {
      return NextResponse.json(
        {
          error: "Agent already exists",
          details: "An active agent record already exists for this user",
        },
        { status: 400 },
      )
    }

    // Convert specialties string to array if it's not empty
    const specialtiesArray = data.specialties ? [data.specialties] : []

    // Create the agent record
    const agent = await sql`
      INSERT INTO agents (
        user_id, license_number, brokerage, commission_rate, specialties, bio
      ) VALUES (
        ${user[0].id}, ${data.license_number}, ${data.brokerage}, 
        ${data.commission_rate}, ${specialtiesArray}, ${data.bio || ""}
      ) RETURNING *
    `

    console.log("[v0] Agent created successfully:", agent[0])

    return NextResponse.json({
      agent: {
        ...agent[0],
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
      },
    })
  } catch (error) {
    console.error("Error creating agent:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
