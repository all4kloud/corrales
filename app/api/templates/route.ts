import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const templates = await sql`
      SELECT * FROM follow_up_event_templates 
      ORDER BY transaction_type, days_from_contract
    `
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_type, event_name, description, days_from_contract, priority, is_active } = body

    const result = await sql`
      INSERT INTO follow_up_event_templates 
      (transaction_type, event_name, description, days_from_contract, priority, is_active)
      VALUES (${transaction_type}, ${event_name}, ${description}, ${days_from_contract}, ${priority}, ${is_active})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
