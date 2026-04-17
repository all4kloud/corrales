// Authentication utilities for Conecta
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { jwtVerify } from "jose"
import { sql } from "./database"
import type { User } from "./database"
import type { NextRequest } from "next/server"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    const users = await sql`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.email = ${email} AND u.is_active = true
    `
    return users[0] || null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function createUser(userData: {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
  role_id: number
}): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(userData.password)

    const users = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id)
      VALUES (${userData.email}, ${hashedPassword}, ${userData.first_name}, ${userData.last_name}, ${userData.phone || null}, ${userData.role_id})
      RETURNING *
    `

    return users[0] || null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function verifyToken(token: string): Promise<any | null> {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any

    const users = await sql`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ${decoded.userId} AND u.is_active = true
    `

    return users[0] || null
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, process.env.NEXTAUTH_SECRET!, { expiresIn: "7d" })
}

// Verify auth token from request cookies for API routes
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function verifyAuth(request: NextRequest): Promise<{
  authenticated: boolean
  userId?: string
  role?: string
  email?: string
  firstName?: string
  lastName?: string
}> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return { authenticated: false }
    }

    const { payload } = await jwtVerify(token, secret)
    
    return {
      authenticated: true,
      userId: payload.userId as string,
      role: payload.role as string,
      email: payload.email as string,
      firstName: payload.firstName as string | undefined,
      lastName: payload.lastName as string | undefined,
    }
  } catch (error) {
    console.error("Error verifying auth:", error)
    return { authenticated: false }
  }
}
