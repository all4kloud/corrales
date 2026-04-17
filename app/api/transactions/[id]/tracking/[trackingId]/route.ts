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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackingId: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {

    const { trackingId } = await params
    const { tracking_type_id, description } = await request.json()

    if (!tracking_type_id) {
      return NextResponse.json({ error: "Tracking type is required" }, { status: 400 })
    }

    await sql`
      UPDATE transaction_tracking
      SET tracking_type_id = ${tracking_type_id}::uuid,
          description = ${description || null}
      WHERE id = ${trackingId}::uuid
    `

    // Fetch the updated entry with joined data
    const updatedEntry = await sql`
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
      WHERE tt.id = ${trackingId}::uuid
    `

    return NextResponse.json(updatedEntry[0])
  } catch (error) {
    console.error("Error updating tracking entry:", error)
    return NextResponse.json({ error: "Failed to update tracking entry" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; trackingId: string }> }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { trackingId } = await params

    await sql`
      DELETE FROM transaction_tracking
      WHERE id = ${trackingId}::uuid
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tracking entry:", error)
    return NextResponse.json({ error: "Failed to delete tracking entry" }, { status: 500 })
  }
}
