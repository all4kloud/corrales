import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword } from "@/lib/auth"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isCustomer = user.role === "customer" || user.role_name === "customer"
    if (isCustomer) {
      return NextResponse.json(
        {
          error: "Please use the Customer Portal to login",
          redirectTo: "/portal/login",
        },
        { status: 403 },
      )
    }

    // Create JWT token - Extended to 7 days for better user experience
    const token = await new SignJWT({
      sub: user.id.toString(),
      userId: user.id,
      email: user.email,
      role: user.role_name,
      firstName: user.first_name,
      lastName: user.last_name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
      },
    })

    // Set HTTP-only cookie - 7 days expiration
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
