import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getUserByEmail } from "@/lib/auth"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const user = await getUserByEmail(payload.email as string)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
      },
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
