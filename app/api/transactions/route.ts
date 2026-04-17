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

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status   = searchParams.get("status")
    const priority = searchParams.get("priority")
    const type     = searchParams.get("type")
    const search   = searchParams.get("search") || ""
    const page     = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("pageSize") || "15")))
    const offset   = (page - 1) * pageSize
    const sort     = searchParams.get("sort") || "closing_date"
    const order    = searchParams.get("order") || "asc"

    const validSortColumns = ["created_at", "closing_date", "property_address", "status", "purchase_price", "priority"]
    const sortColumn = validSortColumns.includes(sort) ? sort : "closing_date"
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC"
    
    // Define status priority: pending (1), closed (2), cancelled (3)
    const statusOrderClause = "CASE t.status WHEN 'pending' THEN 1 WHEN 'closed' THEN 2 WHEN 'cancelled' THEN 3 ELSE 4 END"

    // Check if user is an assistant - they can only see assigned transactions
    const isAssistant = auth.role === "assistant"
    const userId = auth.userId as string

    // Build shared search clause (applied in all three query branches)
    const searchClause = search
      ? `AND (
          p.address ILIKE '%${search.replace(/'/g, "''")}%' OR
          p.city    ILIKE '%${search.replace(/'/g, "''")}%' OR
          p.state   ILIKE '%${search.replace(/'/g, "''")}%' OR
          EXISTS (
            SELECT 1 FROM transaction_buyers tb2
            JOIN customers cb ON tb2.customer_id = cb.id
            WHERE tb2.transaction_id = t.id
              AND (cb.first_name || ' ' || cb.last_name) ILIKE '%${search.replace(/'/g, "''")}%'
          ) OR
          EXISTS (
            SELECT 1 FROM transaction_sellers ts2
            JOIN customers cs ON ts2.customer_id = cs.id
            WHERE ts2.transaction_id = t.id
              AND (cs.first_name || ' ' || cs.last_name) ILIKE '%${search.replace(/'/g, "''")}%'
          )
        )`
      : ""

    let transactions
    let total = 0

    if (status || priority || type || search) {
      const whereConditions = []
      if (status)   whereConditions.push(`t.status = '${status}'`)
      if (priority) whereConditions.push(`t.priority = '${priority}'`)
      if (type)     whereConditions.push(`t.transaction_type = '${type}'`)

      // Add assistant restriction
      if (isAssistant) {
        whereConditions.push(`EXISTS (SELECT 1 FROM transaction_assignments ta WHERE ta.transaction_id = t.id AND ta.assigned_to_user_id = '${userId}'::uuid)`)
      }

      const filterClause = whereConditions.length > 0 ? `AND ${whereConditions.join(" AND ")}` : ""
      const whereClause  = `${filterClause} ${searchClause}`

      // Total count for pagination
      const countResult = await sql`
        SELECT COUNT(*)::integer AS total
        FROM transactions t
        LEFT JOIN properties p ON t.property_id = p.id
        WHERE t.is_active = true ${sql.unsafe(whereClause)}
      `
      total = countResult[0]?.total ?? 0

      transactions = await sql`
        SELECT 
          t.*,
          p.address as property_address,
          p.city as property_city,
          p.state as property_state,
          p.zip_code as property_zip_code,
          lau.first_name as listing_agent_first_name,
          lau.last_name as listing_agent_last_name,
          clau.first_name as co_listing_agent_first_name,
          clau.last_name as co_listing_agent_last_name,
          sau.first_name as buyer_agent_first_name,
          sau.last_name as buyer_agent_last_name,
          csau.first_name as co_buyer_agent_first_name,
          csau.last_name as co_buyer_agent_last_name,
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
          (SELECT COUNT(*) FROM follow_up_events f WHERE f.transaction_id = t.id)::integer as total_tasks,
          (SELECT COUNT(*) FROM follow_up_events f WHERE f.transaction_id = t.id AND f.status IN ('completed', 'not_applicable'))::integer as completed_tasks
        FROM transactions t
        LEFT JOIN properties p ON t.property_id = p.id
        LEFT JOIN agents la_agent ON t.listing_agent_id = la_agent.id
        LEFT JOIN users lau ON la_agent.user_id = lau.id
        LEFT JOIN agents cla_agent ON t.co_listing_agent_id = cla_agent.id
        LEFT JOIN users clau ON cla_agent.user_id = clau.id
        LEFT JOIN agents sa_agent ON t.buyer_agent_id = sa_agent.id
        LEFT JOIN users sau ON sa_agent.user_id = sau.id
        LEFT JOIN agents csa_agent ON t.co_buyer_agent_id = csa_agent.id
        LEFT JOIN users csau ON csa_agent.user_id = csau.id
        WHERE t.is_active = true ${sql.unsafe(whereClause)}
        ORDER BY ${sql.unsafe(statusOrderClause)}, ${sql.unsafe(`t.${sortColumn} ${sortOrder}`)}
        LIMIT ${pageSize} OFFSET ${offset}
      `
    } else {
      // For assistants, only show assigned transactions
      if (isAssistant) {
        const countResult = await sql`
          SELECT COUNT(*)::integer AS total
          FROM transactions t
          INNER JOIN transaction_assignments ta ON t.id = ta.transaction_id AND ta.assigned_to_user_id = ${userId}::uuid
          LEFT JOIN properties p ON t.property_id = p.id
          WHERE t.is_active = true ${sql.unsafe(searchClause)}
        `
        total = countResult[0]?.total ?? 0

        transactions = await sql`
          SELECT 
            t.*,
            p.address as property_address,
            p.city as property_city,
            p.state as property_state,
            p.zip_code as property_zip_code,
            lau.first_name as listing_agent_first_name,
            lau.last_name as listing_agent_last_name,
            clau.first_name as co_listing_agent_first_name,
            clau.last_name as co_listing_agent_last_name,
            sau.first_name as buyer_agent_first_name,
            sau.last_name as buyer_agent_last_name,
            csau.first_name as co_buyer_agent_first_name,
            csau.last_name as co_buyer_agent_last_name,
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
            (SELECT COUNT(*) FROM follow_up_events f WHERE f.transaction_id = t.id)::integer as total_tasks,
            (SELECT COUNT(*) FROM follow_up_events f WHERE f.transaction_id = t.id AND f.status IN ('completed', 'not_applicable'))::integer as completed_tasks
          FROM transactions t
          INNER JOIN transaction_assignments ta ON t.id = ta.transaction_id AND ta.assigned_to_user_id = ${userId}::uuid
          LEFT JOIN properties p ON t.property_id = p.id
          LEFT JOIN agents la_agent ON t.listing_agent_id = la_agent.id
          LEFT JOIN users lau ON la_agent.user_id = lau.id
          LEFT JOIN agents cla_agent ON t.co_listing_agent_id = cla_agent.id
          LEFT JOIN users clau ON cla_agent.user_id = clau.id
          LEFT JOIN agents sa_agent ON t.buyer_agent_id = sa_agent.id
          LEFT JOIN users sau ON sa_agent.user_id = sau.id
          LEFT JOIN agents csa_agent ON t.co_buyer_agent_id = csa_agent.id
          LEFT JOIN users csau ON csa_agent.user_id = csau.id
          WHERE t.is_active = true ${sql.unsafe(searchClause)}
          ORDER BY ${sql.unsafe(statusOrderClause)}, ${sql.unsafe(`t.${sortColumn} ${sortOrder}`)}
          LIMIT ${pageSize} OFFSET ${offset}
        `
      } else {
        // For managers and agents, show all transactions
        const countResult = await sql`
          SELECT COUNT(*)::integer AS total
          FROM transactions t
          LEFT JOIN properties p ON t.property_id = p.id
          WHERE t.is_active = true ${sql.unsafe(searchClause)}
        `
        total = countResult[0]?.total ?? 0

        transactions = await sql`
          SELECT 
            t.*,
            p.address as property_address,
            p.city as property_city,
            p.state as property_state,
            p.zip_code as property_zip_code,
            lau.first_name as listing_agent_first_name,
            lau.last_name as listing_agent_last_name,
            clau.first_name as co_listing_agent_first_name,
            clau.last_name as co_listing_agent_last_name,
            sau.first_name as buyer_agent_first_name,
            sau.last_name as buyer_agent_last_name,
            csau.first_name as co_buyer_agent_first_name,
            csau.last_name as co_buyer_agent_last_name,
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
            (SELECT COUNT(*) FROM follow_up_events f WHERE f.transaction_id = t.id)::integer as total_tasks,
            (SELECT COUNT(*) FROM follow_up_events f WHERE f.transaction_id = t.id AND f.status IN ('completed', 'not_applicable'))::integer as completed_tasks
          FROM transactions t
          LEFT JOIN properties p ON t.property_id = p.id
          LEFT JOIN agents la_agent ON t.listing_agent_id = la_agent.id
          LEFT JOIN users lau ON la_agent.user_id = lau.id
          LEFT JOIN agents cla_agent ON t.co_listing_agent_id = cla_agent.id
          LEFT JOIN users clau ON cla_agent.user_id = clau.id
          LEFT JOIN agents sa_agent ON t.buyer_agent_id = sa_agent.id
          LEFT JOIN users sau ON sa_agent.user_id = sau.id
          LEFT JOIN agents csa_agent ON t.co_buyer_agent_id = csa_agent.id
          LEFT JOIN users csau ON csa_agent.user_id = csau.id
          WHERE t.is_active = true ${sql.unsafe(searchClause)}
          ORDER BY ${sql.unsafe(statusOrderClause)}, ${sql.unsafe(`t.${sortColumn} ${sortOrder}`)}
          LIMIT ${pageSize} OFFSET ${offset}
        `
      }
    }

    return NextResponse.json({ transactions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await request.json()

    console.log("[v0] Creating transaction with data:", data)

    const contractDate = data.contract_date && data.contract_date.trim() !== "" ? data.contract_date : null
    const closingDate = data.closing_date && data.closing_date.trim() !== "" ? data.closing_date : null
    const dueDiligenceDate =
      data.due_diligence_date && data.due_diligence_date.trim() !== "" ? data.due_diligence_date : null
    const inspectionDate = data.inspection_date && data.inspection_date.trim() !== "" ? data.inspection_date : null
    const appraisalDate = data.appraisal_date && data.appraisal_date.trim() !== "" ? data.appraisal_date : null

    const transaction = await sql`
      INSERT INTO transactions (
        transaction_type, property_id,
        listing_agent_id, co_listing_agent_id, buyer_agent_id, co_buyer_agent_id,
        lender_id, attorney_id,
        contract_date, closing_date, due_diligence_date, inspection_date, appraisal_date,
        purchase_price, commission_rate, 
        seller_commission_rate, buyer_commission_rate, 
        commission_flat_fee, closing_fee, brokerage_fee,
        due_diligence_money, earnest_money_deposit,
        status, priority, notes, is_active
      ) VALUES (
        ${data.transaction_type}::text, 
        ${data.property_id}::uuid, 
        ${data.listing_agent_id || null}::uuid,
        ${data.co_listing_agent_id || null}::uuid,
        ${data.buyer_agent_id || null}::uuid,
        ${data.co_buyer_agent_id || null}::uuid,
        ${data.lender_id || null}::uuid, 
        ${data.attorney_id || null}::uuid,
        ${contractDate}::date, 
        ${closingDate}::date,
        ${dueDiligenceDate}::date,
        ${inspectionDate}::date,
        ${appraisalDate}::date,
        ${data.purchase_price || null}::numeric, 
        ${data.commission_rate || null}::numeric,
        ${data.seller_commission_rate || null}::numeric,
        ${data.buyer_commission_rate || null}::numeric,
        ${data.commission_flat_fee || null}::numeric,
        ${data.closing_fee || null}::numeric,
        ${data.brokerage_fee || null}::numeric,
        ${data.due_diligence_money || null}::numeric,
        ${data.earnest_money_deposit || null}::numeric,
        ${data.status || "pending"}::text, 
        ${data.priority || "medium"}::text, 
        ${data.notes || ""}::text,
        true
      ) RETURNING *
    `

    const transactionId = transaction[0].id

    if (data.buyer_ids && Array.isArray(data.buyer_ids) && data.buyer_ids.length > 0) {
      for (const buyerId of data.buyer_ids) {
        await sql`
          INSERT INTO transaction_buyers (transaction_id, customer_id)
          VALUES (${transactionId}::uuid, ${buyerId}::uuid)
          ON CONFLICT (transaction_id, customer_id) DO NOTHING
        `
      }
    }

    if (data.seller_ids && Array.isArray(data.seller_ids) && data.seller_ids.length > 0) {
      for (const sellerId of data.seller_ids) {
        await sql`
          INSERT INTO transaction_sellers (transaction_id, customer_id)
          VALUES (${transactionId}::uuid, ${sellerId}::uuid)
          ON CONFLICT (transaction_id, customer_id) DO NOTHING
        `
      }
    }

    console.log("[v0] Transaction created successfully:", transaction[0])
    return NextResponse.json({ transaction: transaction[0] })
  } catch (error) {
    console.error("[v0] Error creating transaction:", error)
    console.error("[v0] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
