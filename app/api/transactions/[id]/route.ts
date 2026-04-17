import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const transactions = await sql`
      SELECT 
        t.*,
        p.address as property_address,
        p.city as property_city,
        p.state as property_state,
        p.zip_code as property_zip,
        p.bedrooms,
        p.bathrooms,
        p.square_feet,
        lau.first_name as listing_agent_first_name,
        lau.last_name as listing_agent_last_name,
        co_lau.first_name as co_listing_agent_first_name,
        co_lau.last_name as co_listing_agent_last_name,
        bau.first_name as buyer_agent_first_name,
        bau.last_name as buyer_agent_last_name,
        co_bau.first_name as co_buyer_agent_first_name,
        co_bau.last_name as co_buyer_agent_last_name,
        l.company_name as lender_company_name,
        l.contact_name as lender_contact_name,
        a.firm_name as attorney_firm_name,
        a.attorney_name as attorney_attorney_name,
        (
          SELECT json_agg(json_build_object(
            'id', c.id,
            'first_name', c.first_name,
            'middle_name', c.middle_name,
            'last_name', c.last_name,
            'email', c.email,
            'phone', c.phone
          ))
          FROM transaction_buyers tb
          JOIN customers c ON tb.customer_id = c.id
          WHERE tb.transaction_id = t.id
        ) as buyers,
        (
          SELECT json_agg(json_build_object(
            'id', c.id,
            'first_name', c.first_name,
            'middle_name', c.middle_name,
            'last_name', c.last_name,
            'email', c.email,
            'phone', c.phone
          ))
          FROM transaction_sellers ts
          JOIN customers c ON ts.customer_id = c.id
          WHERE ts.transaction_id = t.id
        ) as sellers,
        (
          SELECT json_agg(json_build_object(
            'id', oe.id,
            'entity_name', oe.entity_name,
            'entity_type', oe.entity_type,
            'email', (
              SELECT ec.email FROM entity_contacts ec
              WHERE ec.entity_id = oe.id AND ec.email IS NOT NULL
              ORDER BY ec.is_primary DESC NULLS LAST
              LIMIT 1
            )
          ))
          FROM transaction_other_entities toe
          JOIN other_entities oe ON toe.other_entity_id = oe.id
          WHERE toe.transaction_id = t.id
        ) as other_entities
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN agents la ON t.listing_agent_id = la.id
      LEFT JOIN users lau ON la.user_id = lau.id
      LEFT JOIN agents co_la ON t.co_listing_agent_id = co_la.id
      LEFT JOIN users co_lau ON co_la.user_id = co_lau.id
      LEFT JOIN agents ba ON t.buyer_agent_id = ba.id
      LEFT JOIN users bau ON ba.user_id = bau.id
      LEFT JOIN agents co_ba ON t.co_buyer_agent_id = co_ba.id
      LEFT JOIN users co_bau ON co_ba.user_id = co_bau.id
      LEFT JOIN lenders l ON t.lender_id = l.id
      LEFT JOIN attorneys a ON t.attorney_id = a.id
      WHERE t.id = ${id}::uuid
    `

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const row = transactions[0]

    const response = {
      transaction: row,
      property: row.property_address
        ? {
            address: row.property_address,
            city: row.property_city,
            state: row.property_state,
            zip_code: row.property_zip,
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            square_feet: row.square_feet,
          }
        : null,
      buyers: row.buyers || [],
      sellers: row.sellers || [],
      listing_agent: row.listing_agent_first_name
        ? {
            first_name: row.listing_agent_first_name,
            last_name: row.listing_agent_last_name,
          }
        : null,
      co_listing_agent: row.co_listing_agent_first_name
        ? {
            first_name: row.co_listing_agent_first_name,
            last_name: row.co_listing_agent_last_name,
          }
        : null,
      buyer_agent: row.buyer_agent_first_name
        ? {
            first_name: row.buyer_agent_first_name,
            last_name: row.buyer_agent_last_name,
          }
        : null,
      co_buyer_agent: row.co_buyer_agent_first_name
        ? {
            first_name: row.co_buyer_agent_first_name,
            last_name: row.co_buyer_agent_last_name,
          }
        : null,
      lender: row.lender_company_name
        ? {
            company_name: row.lender_company_name,
            contact_name: row.lender_contact_name,
          }
        : null,
      attorney: row.attorney_firm_name
        ? {
            firm_name: row.attorney_firm_name,
            attorney_name: row.attorney_attorney_name,
          }
        : null,
      other_entities: row.other_entities || [],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching transaction:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    // Validate: Cannot close transaction if there are incomplete tasks (not completed and not not_applicable)
    if (data.status === "closed") {
      const incompleteTasks = await sql`
        SELECT COUNT(*) as count 
        FROM follow_up_events 
        WHERE transaction_id = ${id}::uuid 
        AND status NOT IN ('completed', 'not_applicable')
      `
      
      const incompleteCount = Number(incompleteTasks[0]?.count || 0)
      
      if (incompleteCount > 0) {
        return NextResponse.json(
          { 
            error: "Cannot close transaction", 
            details: `There are ${incompleteCount} incomplete task(s). All tasks must be completed or marked as not applicable before closing the transaction.` 
          }, 
          { status: 400 }
        )
      }
    }

    const toNumericOrNull = (value: any) => {
      if (value === null || value === undefined || value === "") return null
      const num = Number(value)
      return isNaN(num) ? null : num
    }

    const processedValues = {
      purchase_price: toNumericOrNull(data.purchase_price),
      commission_rate: toNumericOrNull(data.commission_rate),
      seller_commission_rate: toNumericOrNull(data.seller_commission_rate),
      buyer_commission_rate: toNumericOrNull(data.buyer_commission_rate),
      commission_flat_fee: toNumericOrNull(data.commission_flat_fee),
      closing_fee: toNumericOrNull(data.closing_fee),
      brokerage_fee: toNumericOrNull(data.brokerage_fee),
      due_diligence_fee: toNumericOrNull(data.due_diligence_money || data.due_diligence_fee),
      due_diligence_money: toNumericOrNull(data.due_diligence_money),
      closing_costs: toNumericOrNull(data.closing_costs),
      earnest_money_deposit: toNumericOrNull(data.earnest_money_deposit),
    }

    const transaction = await sql`
      UPDATE transactions SET
        transaction_type = ${data.transaction_type || null},
        property_id = ${data.property_id || null}::uuid,
        listing_agent_id = ${data.listing_agent_id || null}::uuid,
        co_listing_agent_id = ${data.co_listing_agent_id || null}::uuid,
        buyer_agent_id = ${data.buyer_agent_id || null}::uuid,
        co_buyer_agent_id = ${data.co_buyer_agent_id || null}::uuid,
        lender_id = ${data.lender_id || null}::uuid,
        attorney_id = ${data.attorney_id || null}::uuid,
        contract_date = ${data.contract_date || null}::date,
        closing_date = ${data.closing_date || null}::date,
        due_diligence_date = ${data.due_diligence_date || null}::date,
        appraisal_date = ${data.appraisal_date || null}::date,
        inspection_date = ${data.inspection_date || null}::date,
        purchase_price = ${processedValues.purchase_price}::numeric,
        commission_rate = ${processedValues.commission_rate}::numeric,
        seller_commission_rate = ${processedValues.seller_commission_rate}::numeric,
        buyer_commission_rate = ${processedValues.buyer_commission_rate}::numeric,
        commission_flat_fee = ${processedValues.commission_flat_fee}::numeric,
        closing_fee = ${processedValues.closing_fee}::numeric,
        brokerage_fee = ${processedValues.brokerage_fee}::numeric,
        due_diligence_fee = ${processedValues.due_diligence_fee}::numeric,
        due_diligence_money = ${processedValues.due_diligence_money}::numeric,
        closing_costs = ${processedValues.closing_costs}::numeric,
        earnest_money_deposit = ${processedValues.earnest_money_deposit}::numeric,
        status = ${data.status || null},
        priority = ${data.priority || null},
        notes = ${data.notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::uuid
      RETURNING *
    `

    if (transaction.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (data.buyer_ids) {
      await sql`DELETE FROM transaction_buyers WHERE transaction_id = ${id}::uuid`

      if (Array.isArray(data.buyer_ids) && data.buyer_ids.length > 0) {
        for (const buyerId of data.buyer_ids) {
          await sql`
            INSERT INTO transaction_buyers (transaction_id, customer_id)
            VALUES (${id}::uuid, ${buyerId}::uuid)
            ON CONFLICT (transaction_id, customer_id) DO NOTHING
          `
        }
      }
    }

    if (data.seller_ids) {
      await sql`DELETE FROM transaction_sellers WHERE transaction_id = ${id}::uuid`

      if (Array.isArray(data.seller_ids) && data.seller_ids.length > 0) {
        for (const sellerId of data.seller_ids) {
          await sql`
            INSERT INTO transaction_sellers (transaction_id, customer_id)
            VALUES (${id}::uuid, ${sellerId}::uuid)
            ON CONFLICT (transaction_id, customer_id) DO NOTHING
          `
        }
      }
    }

    if (data.other_entity_ids !== undefined) {
      await sql`DELETE FROM transaction_other_entities WHERE transaction_id = ${id}::uuid`

      if (Array.isArray(data.other_entity_ids) && data.other_entity_ids.length > 0) {
        for (const entityId of data.other_entity_ids) {
          await sql`
            INSERT INTO transaction_other_entities (transaction_id, other_entity_id)
            VALUES (${id}::uuid, ${entityId}::uuid)
            ON CONFLICT (transaction_id, other_entity_id) DO NOTHING
          `
        }
      }
    }

    return NextResponse.json({ transaction: transaction[0] })
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const userRole = auth.role as string
  if (userRole !== "admin" && userRole !== "manager") {
    return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
  }

  try {
    const result = await sql`
      UPDATE transactions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::uuid
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Transaction deleted successfully" })
  } catch (error) {
    console.error("Error deleting transaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
