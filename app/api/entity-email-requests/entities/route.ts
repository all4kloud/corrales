import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"

// GET /api/entity-email-requests/entities?type=lender|attorney|other_entity&transaction_id=...
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const transactionId = searchParams.get("transaction_id")

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 })
    }

    let entities: any[] = []

    if (type === "lender") {
      if (transactionId) {
        // lender_id is a direct FK on transactions
        entities = await sql`
          SELECT l.id, l.company_name AS name, l.contact_name, l.email, l.phone
          FROM lenders l
          INNER JOIN transactions t ON t.lender_id = l.id
          WHERE t.id = ${transactionId}::uuid
            AND l.email IS NOT NULL AND l.email <> ''
          ORDER BY l.company_name
        `
      } else {
        entities = await sql`
          SELECT id, company_name AS name, contact_name, email, phone
          FROM lenders
          WHERE is_active = true AND email IS NOT NULL AND email <> ''
          ORDER BY company_name
        `
      }
    } else if (type === "attorney") {
      if (transactionId) {
        // attorney_id is a direct FK on transactions — firm_name / attorney_name columns
        entities = await sql`
          SELECT a.id,
            a.firm_name    AS name,
            a.attorney_name AS contact_name,
            a.email,
            a.phone
          FROM attorneys a
          INNER JOIN transactions t ON t.attorney_id = a.id
          WHERE t.id = ${transactionId}::uuid
            AND a.email IS NOT NULL AND a.email <> ''
          ORDER BY a.firm_name
        `
      } else {
        entities = await sql`
          SELECT id,
            firm_name    AS name,
            attorney_name AS contact_name,
            email, phone
          FROM attorneys
          WHERE is_active = true AND email IS NOT NULL AND email <> ''
          ORDER BY firm_name
        `
      }
    } else if (type === "other_entity" || type === "insurance" || type === "appraisal" || type === "title" || type === "contractor") {
      // other_entities are linked via transaction_other_entities junction table.
      // When transaction_id is provided, filter to entities linked to that transaction.
      // Optionally also filter by entity_type (insurance, appraisal, etc.).
      const entityTypeFilter = type !== "other_entity" ? type : null

      if (transactionId) {
        if (entityTypeFilter) {
          entities = await sql`
            SELECT DISTINCT ON (oe.id, ec.email)
              oe.id,
              oe.entity_name AS name,
              ec.contact_name,
              ec.email,
              ec.phone
            FROM other_entities oe
            INNER JOIN transaction_other_entities toe ON toe.other_entity_id = oe.id
            LEFT JOIN entity_contacts ec ON ec.entity_id = oe.id
            WHERE toe.transaction_id = ${transactionId}::uuid
              AND LOWER(oe.entity_type) = ${entityTypeFilter}
              AND oe.is_active = true
            ORDER BY oe.id, ec.email, ec.is_primary DESC NULLS LAST
          `
        } else {
          entities = await sql`
            SELECT DISTINCT ON (oe.id, ec.email)
              oe.id,
              oe.entity_name AS name,
              ec.contact_name,
              ec.email,
              ec.phone
            FROM other_entities oe
            INNER JOIN transaction_other_entities toe ON toe.other_entity_id = oe.id
            LEFT JOIN entity_contacts ec ON ec.entity_id = oe.id
            WHERE toe.transaction_id = ${transactionId}::uuid
              AND oe.is_active = true
            ORDER BY oe.id, ec.email, ec.is_primary DESC NULLS LAST
          `
        }
      } else if (entityTypeFilter) {
        entities = await sql`
          SELECT DISTINCT ON (oe.id, ec.email)
            oe.id,
            oe.entity_name AS name,
            ec.contact_name,
            ec.email,
            ec.phone
          FROM other_entities oe
          LEFT JOIN entity_contacts ec ON ec.entity_id = oe.id
          WHERE oe.is_active = true
            AND LOWER(oe.entity_type) = ${entityTypeFilter}
          ORDER BY oe.id, ec.email, ec.is_primary DESC NULLS LAST
        `
      } else {
        entities = await sql`
          SELECT DISTINCT ON (oe.id, ec.email)
            oe.id,
            oe.entity_name AS name,
            ec.contact_name,
            ec.email,
            ec.phone
          FROM other_entities oe
          LEFT JOIN entity_contacts ec ON ec.entity_id = oe.id
          WHERE oe.is_active = true
          ORDER BY oe.id, ec.email, ec.is_primary DESC NULLS LAST
        `
      }
    } else {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 })
    }

    return NextResponse.json({ entities })
  } catch (error) {
    console.error("Error fetching entities for email:", error)
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 })
  }
}
