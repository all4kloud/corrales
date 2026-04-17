// Database connection utility for Conecta
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL || "")

export { sql }

// Database types
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  description?: string
}

export interface Transaction {
  id: string
  transaction_type: "purchase" | "sale"
  property_id?: string
  buyer_id?: string
  seller_id?: string
  listing_agent_id?: string
  buyer_agent_id?: string
  lender_id?: string
  attorney_id?: string
  contract_date?: string
  closing_date?: string
  purchase_price?: number
  commission_rate?: number
  status: "pending" | "contingent" | "closed" | "cancelled"
  priority: "medium" | "high" | "urgent"
  notes?: string
  created_at: string
  updated_at: string
}

export interface FollowUpEvent {
  id: string
  transaction_id: string
  template_id?: number
  event_name: string
  description?: string
  due_date: string
  priority: "medium" | "high" | "urgent"
  status: "pending" | "completed" | "cancelled" | "overdue"
  assigned_to?: string
  completed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  lot_size?: number
  year_built?: number
  listing_price?: number
  market_value?: number
  mls_number?: string
  description?: string
  features?: string[]
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  notes?: string
  created_at: string
  updated_at: string
}
