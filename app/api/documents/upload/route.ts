import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { jwtVerify } from "jose"
import { getGoogleDriveClient, getOrCreateTransactionFolder } from "@/lib/google-drive"

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

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = auth.sub || auth.userId
  if (!userId) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const taskId = formData.get("task_id") as string | null
    const transactionId = formData.get("transaction_id") as string | null
    const documentTypeId = formData.get("document_type_id") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Determine the target folder
    let targetFolderId: string | null = null
    
    if (transactionId) {
      // Upload to transaction-specific folder
      console.log("[v0] Getting/creating folder for transaction:", transactionId)
      targetFolderId = await getOrCreateTransactionFolder(transactionId)
    } else {
      // Fallback to main folder if no transaction
      const { folderId } = await getGoogleDriveClient()
      targetFolderId = folderId
    }

    if (!targetFolderId) {
      return NextResponse.json({ error: "No Google Drive folder configured" }, { status: 400 })
    }

    const { drive } = await getGoogleDriveClient()

    const buffer = Buffer.from(await file.arrayBuffer())

    const { Readable } = require("stream")
    const stream = new Readable({
      read() {},
    })
    stream.push(buffer)
    stream.push(null)

    console.log("[v0] Uploading file to folder:", targetFolderId)

    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [targetFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    })

    if (!driveResponse.data.id) {
      throw new Error("Failed to upload to Google Drive")
    }

    await drive.permissions.create({
      fileId: driveResponse.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    const fileDetails = await drive.files.get({
      fileId: driveResponse.data.id,
      fields: "id,name,size,webViewLink,webContentLink",
    })

    let uploadedByUuid
    try {
      uploadedByUuid = userId.toString().includes("-") ? userId.toString() : `${userId}::uuid`
    } catch (uuidError) {
      console.error("Error converting userId to UUID:", uuidError)
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    const document = await sql`
      INSERT INTO documents (
        name, 
        file_type, 
        file_size, 
        google_drive_id, 
        google_drive_url,
        task_id,
        transaction_id,
        uploaded_by,
        document_type_id
      ) VALUES (
        ${file.name},
        ${file.type},
        ${file.size},
        ${driveResponse.data.id},
        ${fileDetails.data.webViewLink || ""},
        ${taskId || null},
        ${transactionId || null},
        ${uploadedByUuid},
        ${documentTypeId ? Number.parseInt(documentTypeId) : null}
      )
      RETURNING *
    `

    return NextResponse.json({
      message: "File uploaded successfully",
      document: document[0],
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
