import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import { getGoogleDriveClient, getOrCreateTransactionFolder } from "@/lib/google-drive"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("[v0] Starting document migration to transaction folders...")

    // Pre-check: Verify Google Drive is connected before starting
    let drive
    try {
      const client = await getGoogleDriveClient()
      drive = client.drive
      console.log("[v0] Google Drive connection verified")
    } catch (error) {
      console.error("[v0] Google Drive connection failed:", error)
      return NextResponse.json(
        {
          error: "Google Drive not connected",
          details: error instanceof Error ? error.message : "Unknown error",
          action: "Please go to Settings > Google Drive and reconnect your account before running migration.",
        },
        { status: 400 }
      )
    }

    // Get all documents that have a transaction_id
    const documents = await sql`
      SELECT d.id, d.name, d.transaction_id, d.google_drive_id, d.google_drive_url
      FROM documents d
      WHERE d.transaction_id IS NOT NULL
      ORDER BY d.transaction_id
    `

    console.log(`[v0] Found ${documents.length} documents to migrate`)

    if (documents.length === 0) {
      return NextResponse.json({ 
        message: "No documents to migrate",
        migrated: 0,
        errors: 0,
        total: 0
      })
    }

    let migrated = 0
    let errors = 0
    const errorDetails: Array<{ documentId: string; error: string }> = []

    for (const doc of documents) {
      try {
        console.log(`[v0] Migrating document: ${doc.name} (${doc.id})`)
        console.log(`[v0] - Transaction ID: ${doc.transaction_id}`)
        console.log(`[v0] - Google Drive ID: ${doc.google_drive_id}`)
        console.log(`[v0] - Current URL: ${doc.google_drive_url}`)

        // Validate google_drive_id exists
        if (!doc.google_drive_id) {
          throw new Error("Document has no Google Drive ID")
        }

        // Get or create the transaction folder
        console.log(`[v0] Getting/creating folder for transaction: ${doc.transaction_id}`)
        const transactionFolderId = await getOrCreateTransactionFolder(doc.transaction_id)
        console.log(`[v0] Transaction folder ID: ${transactionFolderId}`)

        // Get current file info to know its parent
        const currentFile = await drive.files.get({
          fileId: doc.google_drive_id,
          fields: "id, name, parents",
        })

        console.log(`[v0] Current file parents:`, currentFile.data.parents)

        // Move file in Google Drive to the transaction folder
        console.log(`[v0] Moving file to new folder...`)
        await drive.files.update({
          fileId: doc.google_drive_id,
          addParents: transactionFolderId,
          removeParents: currentFile.data.parents?.join(",") || "", // Remove from all current parents
          fields: "id, parents, webViewLink",
        })

        // Get updated file info with new URL
        console.log(`[v0] Getting updated file info...`)
        const updatedFile = await drive.files.get({
          fileId: doc.google_drive_id,
          fields: "webViewLink",
        })

        // Update document URL in database
        console.log(`[v0] Updating database...`)
        await sql`
          UPDATE documents
          SET google_drive_url = ${updatedFile.data.webViewLink || doc.google_drive_url}
          WHERE id = ${doc.id}::uuid
        `

        migrated++
        console.log(`[v0] ✓ Successfully migrated: ${doc.name}`)
      } catch (error) {
        errors++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error(`[v0] ✗ Error migrating document ${doc.name}:`, errorMessage)
        console.error(`[v0] Error stack:`, error)
        errorDetails.push({
          documentId: doc.id,
          error: errorMessage,
        })
      }
    }

    console.log(`[v0] Migration complete. Migrated: ${migrated}, Errors: ${errors}`)

    return NextResponse.json({
      message: "Migration completed",
      total: documents.length,
      migrated,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    })
  } catch (error) {
    console.error("[v0] Document migration error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
