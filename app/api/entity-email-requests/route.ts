import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { sendEmail, wrapEmailHtml } from "@/lib/email"

// GET /api/entity-email-requests?follow_up_event_id=...
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const followUpEventId = searchParams.get("follow_up_event_id")
    const transactionId   = searchParams.get("transaction_id")

    const where = followUpEventId
      ? sql`WHERE eer.follow_up_event_id = ${followUpEventId}::uuid`
      : transactionId
      ? sql`WHERE eer.transaction_id = ${transactionId}::uuid`
      : sql`WHERE TRUE`

    const requests = await sql`
      SELECT
        eer.*,
        u.first_name || ' ' || u.last_name AS sent_by_name
      FROM entity_email_requests eer
      LEFT JOIN users u ON eer.sent_by = u.id
      ${where}
      ORDER BY eer.sent_at DESC
    `

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching entity email requests:", error)
    return NextResponse.json({ error: "Failed to fetch entity email requests" }, { status: 500 })
  }
}

// POST /api/entity-email-requests
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      follow_up_event_id,
      transaction_id,
      entity_type,
      entity_ids,   // array of { id, name, email, contact_name }
      subject,
      email_body,
    } = body

    if (!entity_ids || entity_ids.length === 0 || !subject || !email_body) {
      return NextResponse.json(
        { error: "entity_ids, subject and email_body are required" },
        { status: 400 }
      )
    }

    const agentName = [auth.firstName as string, auth.lastName as string]
      .map((s) => (s || "").replace(/[",;<>]/g, "").trim())
      .filter(Boolean)
      .join(" ") || "Conectare"

    const fromRaw = process.env.RESEND_FROM_EMAIL
    if (!fromRaw) {
      return NextResponse.json({ error: "Email service misconfigured: RESEND_FROM_EMAIL not set" }, { status: 500 })
    }

    // Accept both "email@domain.com" and "Name <email@domain.com>" formats
    const angleMatch2  = fromRaw.match(/<([^>]+)>/)
    const fromAddress  = angleMatch2 ? angleMatch2[1].trim() : fromRaw.trim()

    const fromFormatted = `${agentName} via Conectare <${fromAddress}>`
    const bccArchive    = process.env.EMAIL_BCC_ARCHIVE || fromAddress

    const results = []

    for (const entity of entity_ids) {
      // Send email
      const emailResult = await sendEmail({
        to: entity.email,
        from: fromFormatted,
        reply_to: auth.email as string,
        subject,
        html: wrapEmailHtml(email_body.replace(/\n/g, "<br>")),
        bcc: bccArchive,
      })

      // Log in entity_email_requests
      await sql`
        INSERT INTO entity_email_requests (
          follow_up_event_id, transaction_id,
          entity_type, entity_id, entity_name,
          to_email, subject, body, sent_by
        ) VALUES (
          ${follow_up_event_id || null}::uuid,
          ${transaction_id || null}::uuid,
          ${entity_type},
          ${entity.id}::uuid,
          ${entity.name},
          ${entity.email},
          ${subject},
          ${email_body},
          ${auth.userId as string}::uuid
        )
      `

      results.push({ entity_id: entity.id, entity_name: entity.name, email_sent: emailResult.success })
    }

    return NextResponse.json({ results }, { status: 201 })
  } catch (error) {
    console.error("Error sending entity emails:", error)
    return NextResponse.json({ error: "Failed to send entity emails" }, { status: 500 })
  }
}
