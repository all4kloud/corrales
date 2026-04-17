import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TransactionEditView } from "@/components/transactions/transaction-edit-view"

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <TransactionEditView transactionId={id} />
    </DashboardLayout>
  )
}
