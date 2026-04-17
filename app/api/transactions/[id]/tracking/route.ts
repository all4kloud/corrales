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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params

    const trackingEntries = await sql`
      SELECT 
        tt.id,
        tt.transaction_id,
        tt.tracking_type_id,
        ty.code as tracking_type_code,
        ty.name as tracking_type_name,
        tt.description,
        tt.created_by,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        tt.created_at
      FROM transaction_tracking tt
      INNER JOIN tracking_types ty ON tt.tracking_type_id = ty.id
      INNER JOIN users u ON tt.created_by = u.id
      WHERE tt.transaction_id = ${transactionId}::uuid
      ORDER BY tt.created_at DESC
    `

    return NextResponse.json(trackingEntries)
  } catch (error) {
    console.error("Error fetching tracking entries:", error)
    return NextResponse.json({ error: "Failed to fetch tracking entries" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id: transactionId } = await params
    const { tracking_type_id, description } = await request.json()

    if (!tracking_type_id) {
      return NextResponse.json({ error: "Tracking type is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO transaction_tracking (transaction_id, tracking_type_id, description, created_by)
      VALUES (${transactionId}::uuid, ${tracking_type_id}::uuid, ${description || null}, ${auth.userId as string}::uuid)
      RETURNING id
    `

    // Fetch the complete entry with joined data
    const newEntry = await sql`
      SELECT 
        tt.id,
        tt.transaction_id,
        tt.tracking_type_id,
        ty.code as tracking_type_code,
        ty.name as tracking_type_name,
        tt.description,
        tt.created_by,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name,
        tt.created_at
      FROM transaction_tracking tt
      INNER JOIN tracking_types ty ON tt.tracking_type_id = ty.id
      INNER JOIN users u ON tt.created_by = u.id
      WHERE tt.id = ${result[0].id}::uuid
    `

    return NextResponse.json(newEntry[0], { status: 201 })
  } catch (error) {
    console.error("Error creating tracking entry:", error)
    return NextResponse.json({ error: "Failed to create tracking entry" }, { status: 500 })
  }
}
