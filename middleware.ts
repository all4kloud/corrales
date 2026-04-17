import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify, SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

// Define protected routes
const protectedRoutes = ["/dashboard"]
const authRoutes = ["/login", "/register"]
const portalProtectedRoutes = ["/portal/dashboard", "/portal/transactions", "/portal/settings"]
const portalAuthRoutes = ["/portal/login"]

// Token refresh threshold - refresh if less than 1 day remaining
const REFRESH_THRESHOLD = 60 * 60 * 24 // 1 day in seconds

async function refreshToken(payload: any): Promise<string> {
  return await new SignJWT({
    sub: payload.sub,
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value
  const portalToken = request.cookies.get("portal-auth-token")?.value

  // Check route types
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isPortalProtectedRoute = portalProtectedRoutes.some((route) => pathname.startsWith(route))
  const isPortalAuthRoute = portalAuthRoutes.some((route) => pathname.startsWith(route))

  if (isPortalProtectedRoute) {
    if (!portalToken) {
      return NextResponse.redirect(new URL("/portal/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(portalToken, secret)
      const response = NextResponse.next()
      
      // Auto-refresh token if close to expiration
      const exp = payload.exp as number
      const now = Math.floor(Date.now() / 1000)
      if (exp - now < REFRESH_THRESHOLD) {
        const newToken = await refreshToken(payload)
        response.cookies.set("portal-auth-token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })
      }
      
      return response
    } catch (error) {
      console.error("Invalid portal token:", error)
      const response = NextResponse.redirect(new URL("/portal/login", request.url))
      response.cookies.delete("portal-auth-token")
      return response
    }
  }

  if (isPortalAuthRoute && portalToken) {
    try {
      await jwtVerify(portalToken, secret)
      return NextResponse.redirect(new URL("/portal/dashboard", request.url))
    } catch (error) {
      const response = NextResponse.next()
      response.cookies.delete("portal-auth-token")
      return response
    }
  }

  // If accessing a protected route
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(token, secret)
      const response = NextResponse.next()
      
      // Auto-refresh token if close to expiration (less than 1 day remaining)
      const exp = payload.exp as number
      const now = Math.floor(Date.now() / 1000)
      if (exp - now < REFRESH_THRESHOLD) {
        const newToken = await refreshToken(payload)
        response.cookies.set("auth-token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })
      }
      
      return response
    } catch (error) {
      console.error("Invalid token in middleware:", error)
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth-token")
      return response
    }
  }

  // If accessing auth routes (login/register) while authenticated
  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, secret)
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } catch (error) {
      const response = NextResponse.next()
      response.cookies.delete("auth-token")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
