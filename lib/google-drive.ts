import { sql } from "@/lib/database"
import { google } from "googleapis"

export interface GoogleDriveCredentials {
  access_token: string
  refresh_token: string | null
  expires_at: Date
  folder_id: string | null
}

/**
 * Get Google Drive client with automatic token refresh
 * This ensures tokens are always fresh and prevents disconnections
 */
export async function getGoogleDriveClient() {
  const credentials = await sql<GoogleDriveCredentials[]>`
    SELECT * FROM google_drive_credentials 
    WHERE user_id = 'system' 
    ORDER BY created_at DESC 
    LIMIT 1
  `

  if (credentials.length === 0) {
    throw new Error("Google Drive not connected. Please reconnect in Settings.")
  }

  const cred = credentials[0]

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  oauth2Client.setCredentials({
    access_token: cred.access_token,
    refresh_token: cred.refresh_token,
  })

  // Check if token is expired or about to expire (within 5 minutes)
  const expiresAt = new Date(cred.expires_at)
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

  console.log("[v0] Google Drive token check:", {
    expiresAt: expiresAt.toISOString(),
    now: now.toISOString(),
    isExpired: expiresAt <= fiveMinutesFromNow,
    hasRefreshToken: !!cred.refresh_token
  })

  if (expiresAt <= fiveMinutesFromNow) {
    console.log("[v0] Token expired or expiring soon, attempting refresh...")
    
    if (!cred.refresh_token) {
      throw new Error("Google Drive token expired and no refresh token available. Please reconnect in Settings.")
    }

    try {
      // Refresh the access token
      const { credentials: newTokens } = await oauth2Client.refreshAccessToken()
      
      if (!newTokens.access_token) {
        throw new Error("Failed to refresh access token")
      }

      const newExpiresAt = newTokens.expiry_date 
        ? new Date(newTokens.expiry_date) 
        : new Date(Date.now() + 3600000) // Default 1 hour

      console.log("[v0] Token refreshed successfully, new expiry:", newExpiresAt.toISOString())

      // Update database with new tokens
      await sql`
        UPDATE google_drive_credentials 
        SET 
          access_token = ${newTokens.access_token},
          refresh_token = COALESCE(${newTokens.refresh_token}, refresh_token),
          expires_at = ${newExpiresAt},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = 'system'
      `

      // Update the oauth client with new credentials
      oauth2Client.setCredentials({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || cred.refresh_token,
      })

    } catch (refreshError) {
      console.error("[v0] Failed to refresh Google Drive token:", refreshError)
      throw new Error("Failed to refresh Google Drive access. Please reconnect in Settings.")
    }
  }

  return {
    oauth2Client,
    drive: google.drive({ version: "v3", auth: oauth2Client }),
    folderId: cred.folder_id,
  }
}

/**
 * Check if Google Drive is connected and has valid credentials
 */
export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    const credentials = await sql`
      SELECT * FROM google_drive_credentials 
      WHERE user_id = 'system' 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (credentials.length === 0) {
      return false
    }

    // Check if we have a refresh token (essential for long-term connection)
    return !!credentials[0].refresh_token
  } catch (error) {
    console.error("[v0] Error checking Google Drive connection:", error)
    return false
  }
}

/**
 * Get or create a Google Drive folder for a specific transaction
 * Creates a folder with format: "Address - TransactionType" (e.g., "123 Main St - Sale")
 */
export async function getOrCreateTransactionFolder(transactionId: string): Promise<string> {
  // Check if transaction already has a folder
  const transaction = await sql`
    SELECT t.google_drive_folder_id, p.address, t.transaction_type
    FROM transactions t
    LEFT JOIN properties p ON t.property_id = p.id
    WHERE t.id = ${transactionId}::uuid
  `

  if (transaction.length === 0) {
    throw new Error("Transaction not found")
  }

  // If folder already exists, return it
  if (transaction[0].google_drive_folder_id) {
    return transaction[0].google_drive_folder_id
  }

  // Create new folder
  const { drive, folderId: parentFolderId } = await getGoogleDriveClient()

  // Create folder name: "Address - Type" or fallback to transaction ID
  const address = transaction[0].address || "Unknown Address"
  const type = transaction[0].transaction_type || "Transaction"
  const folderName = `${address} - ${type}`

  console.log("[v0] Creating Google Drive folder:", folderName, "| Parent:", parentFolderId || "root")

  // Use configured parent folder if available, otherwise create in root
  const folderMetadata: {
    name: string
    mimeType: string
    parents?: string[]
  } = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentFolderId ? { parents: [parentFolderId] } : {}),
  }

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  })

  const newFolderId = folder.data.id

  if (!newFolderId) {
    throw new Error("Failed to create Google Drive folder")
  }

  // Update transaction with folder ID
  await sql`
    UPDATE transactions
    SET google_drive_folder_id = ${newFolderId}
    WHERE id = ${transactionId}::uuid
  `

  console.log("[v0] Transaction folder created:", newFolderId)

  return newFolderId
}
