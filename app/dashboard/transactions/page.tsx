"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export interface TransactionFiltersState {
  search: string
  status: string
  priority: string
  type: string
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFiltersState>({
    search: "",
    status: "all",
    priority: "all",
    type: "all",
  })

  const handleFilterChange = (newFilters: TransactionFiltersState) => {
    setFilters(newFilters)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <Button asChild>
            <Link href="/dashboard/transactions/new">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Link>
          </Button>
        </div>

        <TransactionFilters filters={filters} onFilterChange={handleFilterChange} />
        <TransactionsList filters={filters} />
      </div>
    </DashboardLayout>
  )
}
