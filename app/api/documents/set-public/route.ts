import { type NextRequest, NextResponse } from "next/server"
import { getGoogleDriveClient } from "@/lib/google-drive"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 })
    }

    const { drive } = await getGoogleDriveClient()

    // Set the file as publicly readable
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    // Get the updated webViewLink
    const fileDetails = await drive.files.get({
      fileId,
      fields: "id,webViewLink",
    })

    return NextResponse.json({
      success: true,
      webViewLink: fileDetails.data.webViewLink,
    })
  } catch (error) {
    console.error("[v0] Error setting public permission:", error)
    return NextResponse.json({ error: "Failed to set file permissions" }, { status: 500 })
  }
}
