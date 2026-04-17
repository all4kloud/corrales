import { type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function verifyPortalAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      isAgent: payload.isAgent === true,
    }
  } catch (error) {
    console.error("Portal auth verification error:", error)
    return null
  }
}
