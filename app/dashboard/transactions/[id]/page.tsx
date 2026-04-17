import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { TransactionDetails } from "@/components/transactions/transaction-details"

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <TransactionDetails transactionId={id} />
    </DashboardLayout>
  )
}
