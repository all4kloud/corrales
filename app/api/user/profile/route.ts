import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, company, license } = body

    await sql`
      UPDATE users 
      SET 
        first_name = ${firstName},
        last_name = ${lastName},
        email = ${email},
        phone = ${phone},
        company = ${company},
        license_number = ${license},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
