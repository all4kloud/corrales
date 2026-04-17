"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
  reportType: string
  startDate: string
  endDate: string
  data: any
}

export function ExportButton({ reportType, startDate, endDate, data }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const exportToCSV = () => {
    setExporting(true)

    try {
      let csvContent = ""
      const filename = `${reportType}-report-${startDate}-to-${endDate}.csv`

      switch (reportType) {
        case "transactions":
          csvContent = "Transaction Type,Status,Count,Average Price,Total Volume\n"
          data.transactionStats?.forEach((item: any) => {
            csvContent += `${item.transaction_type},${item.status},${item.count},${item.avg_price || 0},${item.total_volume || 0}\n`
          })
          break

        case "agents":
          csvContent = "Agent Name,Transaction Count,Average Transaction Value,Total Volume\n"
          data.agentPerformance?.forEach((agent: any) => {
            csvContent += `${agent.agent_name},${agent.transaction_count},${agent.avg_transaction_value || 0},${agent.total_volume || 0}\n`
          })
          break

        case "properties":
          csvContent = "Property Type,Count,Average Price,Min Price,Max Price\n"
          data.propertyStats?.forEach((prop: any) => {
            csvContent += `${prop.property_type},${prop.count},${prop.avg_price || 0},${prop.min_price || 0},${prop.max_price || 0}\n`
          })
          break

        case "overview":
          csvContent = "Metric,Value\n"
          csvContent += `Active Transactions,${data.overview?.active_transactions || 0}\n`
          csvContent += `Closed Transactions,${data.overview?.closed_transactions || 0}\n`
          csvContent += `Pending Transactions,${data.overview?.pending_transactions || 0}\n`
          csvContent += `Average Closed Price,${data.overview?.avg_closed_price || 0}\n`
          csvContent += `Total Volume,${data.overview?.total_volume || 0}\n`
          break

        default:
          throw new Error("Invalid report type")
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Export error:", error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button onClick={exportToCSV} disabled={exporting || !data} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      {exporting ? "Exporting..." : "Export CSV"}
    </Button>
  )
}
