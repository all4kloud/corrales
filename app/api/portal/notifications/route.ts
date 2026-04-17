import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const isAgent = payload.isAgent === true

    if (isAgent) {
      // Agents don't have notifications yet - return empty array
      return NextResponse.json({
        notifications: [],
        unreadCount: 0,
      })
    }

    // Customer notifications
    const users = await sql`
      SELECT email FROM users WHERE id = ${payload.userId as string}::uuid
    `
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const customerResult = await sql`
      SELECT id FROM customers WHERE email = ${user.email}
    `

    if (customerResult.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const customer = customerResult[0]

    const notifications = await sql`
      SELECT 
        id,
        title,
        message,
        type,
        is_read,
        transaction_id,
        task_id,
        created_at
      FROM notifications
      WHERE customer_id = ${customer.id}::uuid
      ORDER BY created_at DESC
      LIMIT 50
    `

    const unreadCount = await sql`
      SELECT COUNT(*)::int as count
      FROM notifications
      WHERE customer_id = ${customer.id}::uuid
      AND is_read = false
    `

    return NextResponse.json({
      notifications,
      unreadCount: unreadCount[0]?.count || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("portal-auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)

    // Get user email
    const users = await sql`
      SELECT email FROM users WHERE id = ${payload.userId as string}::uuid
    `
    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { notificationId, markAllAsRead } = await request.json()

    // Get customer info
    const customerResult = await sql`
      SELECT id FROM customers WHERE email = ${user.email}
    `

    if (customerResult.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const customer = customerResult[0]

    if (markAllAsRead) {
      // Mark all notifications as read
      await sql`
        UPDATE notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE customer_id = ${customer.id}::uuid
        AND is_read = false
      `
    } else if (notificationId) {
      // Mark specific notification as read
      await sql`
        UPDATE notifications
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE id = ${notificationId}::uuid
        AND customer_id = ${customer.id}::uuid
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
