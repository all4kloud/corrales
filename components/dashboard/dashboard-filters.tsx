"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface DashboardFiltersProps {
  filters: {
    search: string
    status: string
    priority: string
    timeRange: string
  }
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}

export function DashboardFilters({ filters, onFilterChange, onClearFilters }: DashboardFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" || filters.status !== "all" || filters.priority !== "all" || filters.timeRange !== "all"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions, clients..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status:
            </Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange("status", value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contingent">Contingent</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority:
            </Label>
            <Select value={filters.priority} onValueChange={(value) => onFilterChange("priority", value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="timeRange" className="text-sm font-medium">
              Time:
            </Label>
            <Select value={filters.timeRange} onValueChange={(value) => onFilterChange("timeRange", value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
