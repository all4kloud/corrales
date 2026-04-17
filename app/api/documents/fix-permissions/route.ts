import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getGoogleDriveClient } from "@/lib/google-drive"
import { verifyAuth } from "@/lib/auth"

async function makeFilePublic(drive: any, fileId: string): Promise<string | null> {
  // Try to create permission — if it already exists, Drive returns an error we can ignore
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    })
  } catch (err: any) {
    // Ignore "already exists" type errors
    if (!err?.message?.includes("already")) throw err
  }

  const fileDetails = await drive.files.get({ fileId, fields: "webViewLink" })
  return fileDetails.data.webViewLink || null
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { transactionId } = body

    const { drive } = await getGoogleDriveClient()
    const results = { fixed: 0, failed: 0, errors: [] as string[] }

    // Fix the transaction folder permission if transactionId is given
    if (transactionId) {
      const txRows = await sql`
        SELECT google_drive_folder_id FROM transactions WHERE id = ${transactionId}::uuid
      `
      const folderId = txRows[0]?.google_drive_folder_id
      if (folderId) {
        try {
          await makeFilePublic(drive, folderId)
          results.fixed++
        } catch (err) {
          results.errors.push(`Folder ${folderId}: ${err instanceof Error ? err.message : "unknown"}`)
          results.failed++
        }
      }
    }

    // Fetch documents — scoped to transaction or all
    const documents = transactionId
      ? await sql`
          SELECT id, name, google_drive_id FROM documents
          WHERE google_drive_id IS NOT NULL AND google_drive_id != ''
            AND transaction_id = ${transactionId}::uuid
        `
      : await sql`
          SELECT id, name, google_drive_id FROM documents
          WHERE google_drive_id IS NOT NULL AND google_drive_id != ''
        `

    for (const doc of documents) {
      try {
        const webViewLink = await makeFilePublic(drive, doc.google_drive_id)
        if (webViewLink) {
          await sql`
            UPDATE documents SET google_drive_url = ${webViewLink} WHERE id = ${doc.id}::uuid
          `
        }
        results.fixed++
      } catch (err) {
        results.failed++
        results.errors.push(`${doc.name}: ${err instanceof Error ? err.message : "unknown"}`)
      }
    }

    return NextResponse.json({
      message: `Permissions updated: ${results.fixed} fixed, ${results.failed} failed`,
      ...results,
    })
  } catch (error) {
    console.error("[v0] Error fixing permissions:", error)
    return NextResponse.json({ error: "Failed to fix permissions" }, { status: 500 })
  }
}
