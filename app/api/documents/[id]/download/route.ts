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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Get Google Drive client
    const { drive } = await getGoogleDriveClient()

    // Get file from Google Drive
    const response = await drive.files.get(
      {
        fileId: document.google_drive_id,
        alt: "media",
      },
      { responseType: "stream" },
    )

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of response.data as any) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": document.file_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.name}"`,
        "Content-Length": buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading document:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
