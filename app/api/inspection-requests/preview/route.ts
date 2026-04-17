import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const requestBody = await request.json()
    const { template_id, transaction_id, inspection_type, inspector_id, requested_date } = requestBody

    if (!template_id || !transaction_id) {
      return NextResponse.json(
        { error: "Missing required fields: template_id and transaction_id are required" },
        { status: 400 }
      )
    }

    // Validate UUID format before querying to avoid cast errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(template_id) || !uuidRegex.test(transaction_id)) {
      return NextResponse.json({ error: "Invalid UUID format for template_id or transaction_id" }, { status: 400 })
    }

    // Fetch template
    const templateResult = await sql`
      SELECT * FROM inspection_email_templates WHERE id = ${template_id}::uuid
    `

    if (templateResult.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const template = templateResult[0]

    // Fetch transaction data for variable replacement
    // agents table links to users via user_id for name/email/phone
    const transactionResult = await sql`
      SELECT 
        t.*,
        p.address as property_address,
        p.city as property_city,
        p.state as property_state,
        p.zip_code as property_zip,
        lu.first_name as listing_agent_first_name,
        lu.last_name  as listing_agent_last_name,
        lu.email      as listing_agent_email,
        lu.phone      as listing_agent_phone,
        bu.first_name as buyer_agent_first_name,
        bu.last_name  as buyer_agent_last_name,
        bu.email      as buyer_agent_email,
        bu.phone      as buyer_agent_phone
      FROM transactions t
      LEFT JOIN properties p  ON t.property_id      = p.id
      LEFT JOIN agents     la ON t.listing_agent_id  = la.id
      LEFT JOIN users      lu ON la.user_id          = lu.id
      LEFT JOIN agents     ba ON t.buyer_agent_id    = ba.id
      LEFT JOIN users      bu ON ba.user_id          = bu.id
      WHERE t.id = ${transaction_id}::uuid
    `

    if (transactionResult.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const transaction = transactionResult[0]

    // Fetch inspector if provided
    let inspectorData: any = null
    if (inspector_id) {
      const inspectorResult = await sql`
        SELECT * FROM inspectors WHERE id = ${inspector_id}::uuid
      `
      if (inspectorResult.length > 0) inspectorData = inspectorResult[0]
    }

    // Determine primary agent based on transaction type
    const isPurchase = transaction.transaction_type === "purchase"
    const agentFirstName = isPurchase ? transaction.buyer_agent_first_name : transaction.listing_agent_first_name
    const agentLastName  = isPurchase ? transaction.buyer_agent_last_name  : transaction.listing_agent_last_name
    const agentEmail     = isPurchase ? transaction.buyer_agent_email      : transaction.listing_agent_email
    const agentPhone     = isPurchase ? transaction.buyer_agent_phone      : transaction.listing_agent_phone
    const agentName      = `${agentFirstName || ""} ${agentLastName || ""}`.trim()

    const closingDateStr = transaction.closing_date
      ? new Date(transaction.closing_date).toLocaleDateString("en-US")
      : ""

    const requestedDateStr = requested_date
      ? new Date(requested_date).toLocaleDateString("en-US")
      : ""

    const variables: Record<string, string> = {
      // Property
      "{{property.address}}":     transaction.property_address || "",
      "{{property.city}}":        transaction.property_city || "",
      "{{property.state}}":       transaction.property_state || "",
      "{{property.zip}}":         transaction.property_zip || "",
      "{{property.fullAddress}}": `${transaction.property_address || ""}, ${transaction.property_city || ""}, ${transaction.property_state || ""} ${transaction.property_zip || ""}`,
      // Transaction
      "{{transaction.type}}":         transaction.transaction_type || "",
      "{{transaction.closing_date}}": closingDateStr,
      "{{transaction.closingDate}}":  closingDateStr,
      // Inspector
      "{{inspector.contact_name}}": inspectorData?.contact_name || inspectorData?.company_name || "",
      "{{inspector.company}}":      inspectorData?.company_name || "",
      "{{inspector.email}}":        inspectorData?.email || "",
      "{{inspector.phone}}":        inspectorData?.phone || "",
      // Inspection type
      "{{inspection_type.name}}": inspection_type || "",
      "{{inspection.type}}":      inspection_type || "",
      // Request
      "{{request.requested_date}}": requestedDateStr,
      // Agent
      "{{agent.name}}":    agentName,
      "{{agent.email}}":   agentEmail || "",
      "{{agent.phone}}":   agentPhone || "",
      "{{agent.company}}": "Conecta Real Estate",
      // Client — buyer for purchase, seller otherwise
      "{{client.type}}": isPurchase ? "Buyer" : "Seller",
      "{{client.name}}": "",   // would need buyer/seller table join — left blank for now
      // Company
      "{{company.name}}": "Conecta Real Estate",
    }

    // Replace variables in subject and body
    let subject = template.subject
    let emailBody = template.body

    // Escape special regex characters (e.g. {{ and }}) before building RegExp
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(escapeRegex(key), "g")
      subject = subject.replace(pattern, value)
      emailBody = emailBody.replace(pattern, value)
    })

    return NextResponse.json({
      subject,
      html: emailBody,
    })
  } catch (error) {
    console.error("[v0] Error generating inspection preview:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
