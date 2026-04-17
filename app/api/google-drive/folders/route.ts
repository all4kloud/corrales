import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import { getGoogleDriveClient as getClient } from "@/lib/google-drive"

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

async function getGoogleDriveClientWithFolder() {
  try {
    const { drive, folderId } = await getClient()
    
    // Get folder name if folderId exists
    const credentials = await sql`
      SELECT folder_name FROM google_drive_credentials 
      WHERE user_id = 'system'
    `
    
    return {
      drive,
      currentFolder: folderId
        ? {
            id: folderId,
            name: credentials[0]?.folder_name || null,
          }
        : null,
    }
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const client = await getGoogleDriveClientWithFolder()

    if (!client) {
      return NextResponse.json({ connected: false, folders: [], currentFolder: null })
    }

    const { drive, currentFolder } = client

    // Fetch folders from Google Drive
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
      pageSize: 100,
    })

    return NextResponse.json({
      connected: true,
      folders: response.data.files || [],
      currentFolder,
    })
  } catch (error) {
    console.error("Error fetching Google Drive folders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const { folderId } = await request.json()

    if (!folderId || folderId === "root") {
      // Clear folder configuration
      await sql`
        UPDATE google_drive_credentials
        SET folder_id = NULL, folder_name = NULL
        WHERE user_id = 'system'
      `

      return NextResponse.json({
        message: "Folder configuration cleared",
        folder: null,
      })
    }

    // Get folder name from Google Drive
    const client = await getGoogleDriveClientWithFolder()
    if (!client) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 })
    }

    const { drive } = client
    const folderDetails = await drive.files.get({
      fileId: folderId,
      fields: "id, name",
    })

    // Update folder configuration
    await sql`
      UPDATE google_drive_credentials
      SET folder_id = ${folderId}, folder_name = ${folderDetails.data.name}
      WHERE user_id = 'system'
    `

    return NextResponse.json({
      message: "Folder configuration updated",
      folder: {
        id: folderId,
        name: folderDetails.data.name,
      },
    })
  } catch (error) {
    console.error("Error updating folder configuration:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
