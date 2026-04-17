import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { LenderDetailsNew } from "@/components/lenders/lender-details-new"
import { notFound } from "next/navigation"
import { sql } from "@/lib/database"

async function getLender(id: string) {
  try {
    const lenderResult = await sql`
      SELECT * FROM lenders WHERE lender_uuid = ${id}
    `

    if (lenderResult.length === 0) {
      return null
    }

    return lenderResult[0]
  } catch (error) {
    console.error("Error fetching lender:", error)
    return null
  }
}

async function getLenderTransactions(id: string) {
  try {
    const transactionsResult = await sql`
      SELECT 
        t.*,
        p.address,
        p.city,
        p.state,
        p.zip_code,
        p.property_type,
        p.square_feet,
        p.bedrooms,
        p.bathrooms,
        p.year_built,
        a.first_name as agent_first_name,
        a.last_name as agent_last_name,
        a.email as agent_email,
        a.phone as agent_phone,
        l.company_name as lender_company,
        att.first_name as attorney_first_name,
        att.last_name as attorney_last_name
      FROM transactions t
      LEFT JOIN properties p ON t.property_uuid = p.property_uuid
      LEFT JOIN agents a ON t.agent_uuid = a.agent_uuid
      LEFT JOIN lenders l ON t.lender_uuid = l.lender_uuid
      LEFT JOIN attorneys att ON t.attorney_uuid = att.attorney_uuid
      WHERE t.lender_uuid = ${id}
        AND t.is_active = true
      ORDER BY t.created_at DESC
    `

    return transactionsResult || []
  } catch (error) {
    console.error("Error fetching lender transactions:", error)
    return []
  }
}

export default async function LenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lender = await getLender(id)

  if (!lender) {
    notFound()
  }

  const transactions = await getLenderTransactions(id)

  return (
    <DashboardLayout>
      <LenderDetailsNew lender={lender} transactions={transactions} />
    </DashboardLayout>
  )
}
