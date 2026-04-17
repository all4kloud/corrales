import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { sendEmail, wrapEmailHtml, type EmailAttachment } from "@/lib/email"
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  try {
    const formData = await request.formData()

    const to_email   = formData.get("to_email") as string
    const to_name    = formData.get("to_name") as string | null
    const subject    = formData.get("subject") as string
    const emailBody  = formData.get("body") as string
    const party_type = formData.get("party_type") as string | null
    const party_id   = formData.get("party_id") as string | null
    const ccRaw      = formData.get("cc") as string | null
    const cc: string[] = ccRaw ? JSON.parse(ccRaw) : []

    if (!to_email || !subject || !emailBody) {
      return NextResponse.json({ error: "to_email, subject and body are required" }, { status: 400 })
    }

    // Process attached files — convert each to base64 for Resend
    const attachments: EmailAttachment[] = []
    const files = formData.getAll("attachments") as File[]
    for (const file of files) {
      if (file.size === 0) continue
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString("base64")
      attachments.push({ filename: file.name, content: base64 })
    }

    // Build sender — sanitize name to remove characters that break RFC 5322
    const rawFirst   = (auth.firstName as string) || ""
    const rawLast    = (auth.lastName  as string) || ""
    const agentName  = [rawFirst, rawLast]
      .map((s) => s.replace(/[",;<>]/g, "").trim())
      .filter(Boolean)
      .join(" ") || "Conectare"

    const fromRaw = process.env.RESEND_FROM_EMAIL
    if (!fromRaw) {
      return NextResponse.json(
        { error: "Email service misconfigured: RESEND_FROM_EMAIL not set" },
        { status: 500 }
      )
    }

    // Accept both "email@domain.com" and "Name <email@domain.com>" formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const angleMatch = fromRaw.match(/<([^>]+)>/)
    const fromAddress = angleMatch ? angleMatch[1].trim() : fromRaw.trim()

    if (!emailRegex.test(fromAddress)) {
      return NextResponse.json(
        { error: "Email service misconfigured: invalid RESEND_FROM_EMAIL format" },
        { status: 500 }
      )
    }

    const fromFormatted = `${agentName} via Conectare <${fromAddress}>`

    // BCC archive address — always keeps a copy for traceability
    const bccArchive = process.env.EMAIL_BCC_ARCHIVE || fromAddress

    // Send via Resend
    const result = await sendEmail({
      to: to_email,
      from: fromFormatted,
      reply_to: auth.email as string,
      subject,
      html: wrapEmailHtml(emailBody.replace(/\n/g, "<br>")),
      ...(cc.length > 0 ? { cc } : {}),
      bcc: bccArchive,
      ...(attachments.length > 0 ? { attachments } : {}),
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email", details: result.error }, { status: 500 })
    }

    // Log trazability in DB — cc_emails is text[] so pass array directly
    await sql`
      INSERT INTO transaction_email_logs (
        transaction_id, sent_by,
        to_email, party_name, cc_emails,
        subject, body, party_type
      ) VALUES (
        ${id}::uuid,
        ${auth.userId as string}::uuid,
        ${to_email},
        ${to_name || null},
        ${cc.length > 0 ? sql.array(cc) : null},
        ${subject},
        ${emailBody},
        ${party_type || null}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error sending party email:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
