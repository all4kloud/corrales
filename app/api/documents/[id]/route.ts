import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { google } from "googleapis"
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

async function getGoogleDriveClient() {
  // Get stored credentials
  const credentials = await sql`
    SELECT * FROM google_drive_credentials 
    WHERE user_id = 'system' 
    ORDER BY created_at DESC 
    LIMIT 1
  `

  if (credentials.length === 0) {
    throw new Error("Google Drive not connected")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  oauth2Client.setCredentials({
    access_token: credentials[0].access_token,
    refresh_token: credentials[0].refresh_token,
  })

  return { oauth2Client, drive: google.drive({ version: "v3", auth: oauth2Client }) }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const documentId = id

    // Get document details
    const documents = await sql`
      SELECT * FROM documents WHERE id = ${documentId}
    `

    if (documents.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = documents[0]

    // Check if user can delete (owner or admin)
    if (document.uploaded_by !== auth.sub && auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
      // Delete from Google Drive
      const { drive } = await getGoogleDriveClient()
      await drive.files.delete({
        fileId: document.google_drive_id,
      })
    } catch (driveError) {
      console.error("Error deleting from Google Drive:", driveError)
      // Continue with database deletion even if Drive deletion fails
    }

    // Delete from database
    await sql`
      DELETE FROM documents WHERE id = ${documentId}
    `

    return NextResponse.json({ message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
