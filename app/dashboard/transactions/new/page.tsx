import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TransactionForm } from "@/components/transactions/transaction-form"

export default function NewTransactionPage() {
  return (
    <DashboardLayout>
      <TransactionForm />
    </DashboardLayout>
  )
}
