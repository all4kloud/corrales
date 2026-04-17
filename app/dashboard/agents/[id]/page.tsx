import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AgentDetails } from "@/components/agents/agent-details"
import { notFound } from "next/navigation"
import { sql } from "@/lib/database"

async function getAgent(id: string) {
  try {
    const agents = await sql`
      SELECT 
        a.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
      FROM agents a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ${id}
    `

    if (agents.length === 0) {
      return null
    }

    return agents[0]
  } catch (error) {
    console.error("Error fetching agent:", error)
    return null
  }
}

async function getAgentTransactions(id: string) {
  try {
    const transactions = await sql`
      SELECT 
        t.*,
        p.address as property_address,
        p.city,
        p.state,
        p.zip_code
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
      WHERE t.agent_id = ${id}
        AND t.is_active = true
      ORDER BY t.created_at DESC
    `

    return transactions || []
  } catch (error) {
    console.error("Error fetching agent transactions:", error)
    return []
  }
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = await getAgent(id)

  if (!agent) {
    notFound()
  }

  const transactions = await getAgentTransactions(id)

  return (
    <DashboardLayout>
      <AgentDetails agent={agent} transactions={transactions} />
    </DashboardLayout>
  )
}
