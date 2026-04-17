"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { FollowUpForm } from "@/components/follow-ups/follow-up-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function NewFollowUpPage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transaction_id")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={transactionId ? `/dashboard/transactions/${transactionId}/edit` : "/dashboard/follow-ups"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Add Follow-up</h1>
        </div>

        <FollowUpForm
          initialData={transactionId ? { transaction_id: transactionId } : undefined}
          returnTo={transactionId ? `/dashboard/transactions/${transactionId}/edit` : undefined}
        />
      </div>
    </DashboardLayout>
  )
}
