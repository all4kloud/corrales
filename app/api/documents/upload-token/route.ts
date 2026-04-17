import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import { getGoogleDriveClient, getOrCreateTransactionFolder } from "@/lib/google-drive"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

/**
 * Get a temporary access token for direct client-side upload to Google Drive
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await jwtVerify(token, secret)

    const { transactionId } = await request.json()

    // Get access token from Google Drive client
    const client = await getGoogleDriveClient()
    
    // Get the credentials to extract access token
    const credentials = await sql`
      SELECT access_token FROM google_drive_credentials 
      WHERE user_id = 'system' 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (credentials.length === 0) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 })
    }

    // Get or create transaction folder if transactionId provided
    let targetFolderId = client.folderId
    if (transactionId) {
      targetFolderId = await getOrCreateTransactionFolder(transactionId)
    }

    return NextResponse.json({
      accessToken: credentials[0].access_token,
      folderId: targetFolderId,
    })
  } catch (error) {
    console.error("[v0] Error getting upload token:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const isConfig = message.includes("folder") || message.includes("connected") || message.includes("token")
    return NextResponse.json(
      {
        error: "Failed to get upload token",
        details: message,
        hint: isConfig ? "Check Google Drive connection and folder settings in Settings > Integrations." : undefined,
      },
      { status: 500 }
    )
  }
}
