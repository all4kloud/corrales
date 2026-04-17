import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; attachmentId: string } }) {
  try {
    const { attachmentId } = params

    await sql`
      DELETE FROM documents
      WHERE id = ${attachmentId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
  }
}
