import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { sendEmail, wrapEmailHtml } from "@/lib/email"

// GET /api/inspection-requests - List inspection requests
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transaction_id")
    const followUpEventId = searchParams.get("follow_up_event_id")

    let requests

    if (followUpEventId) {
      requests = await sql`
        SELECT 
          ir.*,
          it.name as inspection_type_name,
          i.company_name as inspector_company,
          i.contact_name as inspector_contact,
          i.email as inspector_email,
          i.phone as inspector_phone,
          u.first_name || ' ' || u.last_name as sent_by_name
        FROM inspection_requests ir
        LEFT JOIN inspection_types it ON ir.inspection_type_id = it.id
        LEFT JOIN inspectors i ON ir.inspector_id = i.id
        LEFT JOIN users u ON ir.email_sent_by = u.id
        WHERE ir.follow_up_event_id = ${followUpEventId}::uuid
        ORDER BY ir.created_at DESC
      `
    } else if (transactionId) {
      requests = await sql`
        SELECT 
          ir.*,
          it.name as inspection_type_name,
          i.company_name as inspector_company,
          i.contact_name as inspector_contact,
          i.email as inspector_email,
          i.phone as inspector_phone,
          u.first_name || ' ' || u.last_name as sent_by_name,
          fe.event_name as follow_up_event_name
        FROM inspection_requests ir
        LEFT JOIN inspection_types it ON ir.inspection_type_id = it.id
        LEFT JOIN inspectors i ON ir.inspector_id = i.id
        LEFT JOIN users u ON ir.email_sent_by = u.id
        LEFT JOIN follow_up_events fe ON ir.follow_up_event_id = fe.id
        WHERE ir.transaction_id = ${transactionId}::uuid
        ORDER BY ir.created_at DESC
      `
    } else {
      requests = await sql`
        SELECT 
          ir.*,
          it.name as inspection_type_name,
          i.company_name as inspector_company,
          i.contact_name as inspector_contact,
          i.email as inspector_email,
          i.phone as inspector_phone,
          u.first_name || ' ' || u.last_name as sent_by_name,
          t.status as transaction_status,
          p.address as property_address
        FROM inspection_requests ir
        LEFT JOIN inspection_types it ON ir.inspection_type_id = it.id
        LEFT JOIN inspectors i ON ir.inspector_id = i.id
        LEFT JOIN transactions t ON ir.transaction_id = t.id
        LEFT JOIN properties p ON t.property_id = p.id
        LEFT JOIN users u ON ir.email_sent_by = u.id
        ORDER BY ir.created_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching inspection requests:", error)
    return NextResponse.json({ error: "Failed to fetch inspection requests" }, { status: 500 })
  }
}

// POST /api/inspection-requests - Create and send inspection request
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
      inspection_type_id,
      inspector_ids, // Array of inspector IDs
      requested_date,
      email_subject,
      email_body,
      notes,
    } = body

    if (!transaction_id || !inspector_ids || inspector_ids.length === 0) {
      return NextResponse.json(
        { error: "Transaction and at least one inspector are required" },
        { status: 400 }
      )
    }

    // Treat empty string as null for optional inspection_type_id
    const resolvedTypeId = inspection_type_id && inspection_type_id.trim() !== "" ? inspection_type_id : null

    // Fetch transaction details for email
    const transactions = await sql`
      SELECT 
        t.*,
        p.address, p.city, p.state, p.zip_code,
        COALESCE(b.first_name || ' ' || b.last_name, '') as buyer_name,
        COALESCE(s.first_name || ' ' || s.last_name, '') as seller_name,
        COALESCE(la.user_id, ba.user_id) as agent_user_id
      FROM transactions t
      INNER JOIN properties p ON t.property_id = p.id
      LEFT JOIN customers b ON t.buyer_id = b.id
      LEFT JOIN customers s ON t.seller_id = s.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      WHERE t.id = ${transaction_id}::uuid
    `

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const transaction = transactions[0]

    // Get agent details
    const agents = await sql`
      SELECT u.*, a.brokerage, a.license_number
      FROM users u
      INNER JOIN agents a ON u.id = a.user_id
      WHERE u.id = ${transaction.agent_user_id}::uuid
    `

    const agent = agents[0] || {}

    // Create inspection requests for each inspector and send emails
    const createdRequests = []

    for (const inspectorId of inspector_ids) {
      // Get inspector details
      const inspectors = await sql`
        SELECT * FROM inspectors WHERE id = ${inspectorId}::uuid
      `

      if (inspectors.length === 0) continue

      const inspector = inspectors[0]

      // Create inspection request
      const result = await sql`
        INSERT INTO inspection_requests (
          follow_up_event_id, transaction_id, inspection_type_id, 
          inspector_id, requested_date, notes, email_sent_by
        ) VALUES (
          ${follow_up_event_id || null}::uuid,
          ${transaction_id}::uuid,
          ${resolvedTypeId ? sql`${resolvedTypeId}::uuid` : sql`NULL`},
          ${inspectorId}::uuid,
          ${requested_date || null},
          ${notes || null},
          ${auth.userId}::uuid
        )
        RETURNING *
      `

      const inspectionRequest = result[0]

      // Send email to inspector
      try {
  const emailResult = await sendEmail({
    to: inspector.email,
    subject: email_subject || `Inspection Request for ${transaction.address}`,
    html: wrapEmailHtml(email_body || generateDefaultEmailBody(transaction, inspector, agent, requested_date)),
  })

        if (emailResult.success) {
          // Update request with email sent timestamp
          await sql`
            UPDATE inspection_requests 
            SET email_sent_at = NOW(), status = 'sent'
            WHERE id = ${inspectionRequest.id}::uuid
          `

          // Add to history
          await sql`
            INSERT INTO inspection_request_history (
              inspection_request_id, status_from, status_to, changed_by, notes
            ) VALUES (
              ${inspectionRequest.id}::uuid, 'pending', 'sent', ${auth.userId}::uuid, 'Email sent to inspector'
            )
          `
        }

        createdRequests.push({ ...inspectionRequest, email_sent: emailResult.success })
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        createdRequests.push({ ...inspectionRequest, email_sent: false })
      }
    }

    return NextResponse.json({ requests: createdRequests }, { status: 201 })
  } catch (error) {
    console.error("Error creating inspection request:", error)
    return NextResponse.json({ error: "Failed to create inspection request" }, { status: 500 })
  }
}

function generateDefaultEmailBody(transaction: any, inspector: any, agent: any, requestedDate: string | null): string {
  return `
    <p>Dear ${inspector.contact_name},</p>
    
    <p>We are writing to request an inspection for the following property:</p>
    
    <p><strong>Property Address:</strong><br/>
    ${transaction.address}<br/>
    ${transaction.city}, ${transaction.state} ${transaction.zip_code}</p>
    
    <p><strong>Transaction Details:</strong><br/>
    Transaction Type: ${transaction.transaction_type}<br/>
    Closing Date: ${new Date(transaction.closing_date).toLocaleDateString()}<br/>
    ${requestedDate ? `Requested Inspection Date: ${new Date(requestedDate).toLocaleDateString()}<br/>` : ''}</p>
    
    <p><strong>Agent Information:</strong><br/>
    ${agent.first_name} ${agent.last_name}<br/>
    ${agent.phone || ''}<br/>
    ${agent.email || ''}</p>
    
    <p>Please provide:</p>
    <ol>
      <li>Your availability for the requested date or alternative dates</li>
      <li>Price quote for this inspection</li>
      <li>Expected timeline for the inspection report</li>
    </ol>
    
    <p>Thank you for your prompt attention to this matter.</p>
    
    <p>Best regards,<br/>
    ${agent.first_name} ${agent.last_name}<br/>
    ${agent.brokerage || 'Conecta Real Estate'}</p>
  `
}
