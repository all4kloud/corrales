import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)

    // Only allow admin users
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("[v0] Generating migration report for documents with potential issues...")

    // Get documents that might have issues:
    // 1. Have transaction_id but transaction has no google_drive_folder_id yet
    // 2. Documents without google_drive_id (can't be migrated)
    const problemDocuments = await sql`
      SELECT 
        d.id,
        d.name as document_name,
        d.file_type,
        d.created_at,
        d.google_drive_url,
        d.google_drive_id,
        d.transaction_id,
        t.transaction_type,
        t.status as transaction_status,
        t.google_drive_folder_id,
        p.address as property_address
      FROM documents d
      LEFT JOIN transactions t ON d.transaction_id = t.id
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE d.transaction_id IS NOT NULL
      AND (
        d.google_drive_id IS NULL 
        OR t.google_drive_folder_id IS NULL
      )
      ORDER BY d.created_at DESC
    `

    console.log(`[v0] Found ${problemDocuments.length} documents with potential issues`)

    // Format the report
    const report = problemDocuments.map((doc) => ({
      documentId: doc.id,
      documentName: doc.document_name,
      fileType: doc.file_type,
      uploadedDate: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "N/A",
      propertyAddress: doc.property_address || "No property",
      transactionType: doc.transaction_type || "N/A",
      transactionStatus: doc.transaction_status || "N/A",
      googleDriveUrl: doc.google_drive_url || "No URL",
      hasGoogleDriveId: !!doc.google_drive_id,
      transactionHasFolder: !!doc.google_drive_folder_id,
      issue: !doc.google_drive_id 
        ? "Missing Google Drive ID" 
        : !doc.google_drive_folder_id 
        ? "Transaction folder not created" 
        : "Unknown",
    }))

    return NextResponse.json({
      total: report.length,
      documents: report,
    })
  } catch (error) {
    console.error("[v0] Error generating migration report:", error)
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
