"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import Image from "next/image"
import {
  Home,
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  Briefcase,
  ClipboardList,
  Shield,
  User,
  LogOut,
  Plus,
  ClipboardCheck,
  Mail,
  Search,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transactions", href: "/dashboard/transactions", icon: FileText, addHref: "/dashboard/transactions/new" },
  { name: "Properties", href: "/dashboard/properties", icon: Building2, addHref: "/dashboard/properties/new" },
  { name: "Clients", href: "/dashboard/clients", icon: Users, addHref: "/dashboard/clients/new" },
  { name: "Agents", href: "/dashboard/agents", icon: UserCheck, addHref: "/dashboard/agents/new" },
  { name: "Entities", href: "/dashboard/entities", icon: Briefcase },
  { name: "Inspectors", href: "/dashboard/inspectors", icon: ClipboardCheck, addHref: "/dashboard/inspectors/new" },
  { name: "Inspections", href: "/dashboard/inspections", icon: Search },
  { name: "Templates", href: "/dashboard/templates", icon: ClipboardList, addHref: "/dashboard/templates/new" },
  { name: "Inspection Templates", href: "/dashboard/inspection-templates", icon: Mail, addHref: "/dashboard/inspection-templates/new" },
  { name: "Roles", href: "/dashboard/roles", icon: Shield, addHref: "/dashboard/roles/new" },
  { name: "Profiles", href: "/dashboard/profiles", icon: User, addHref: "/dashboard/profiles/new" },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    subItems: [
      { name: "Overview", href: "/dashboard/reports" },
      { name: "Active Transactions", href: "/dashboard/reports/active-transactions" },
      { name: "Total Volume", href: "/dashboard/reports/total-volume" },
      { name: "Pending Tasks", href: "/dashboard/reports/pending-tasks" },
      { name: "Urgent Items", href: "/dashboard/reports/urgent-items" },
    ],
  },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const toggleExpand = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col h-full transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-6 flex-1">
        <div className={cn("flex items-center gap-2 mb-8", isCollapsed && "justify-center")}>
          <Image
            src="/conecta-logo.png"
            alt="Conecta Logo"
            width={isCollapsed ? 32 : 40}
            height={isCollapsed ? 32 : 40}
            className="flex-shrink-0"
          />
          {!isCollapsed && <h1 className="text-xl font-bold text-sidebar-foreground">Conectare</h1>}
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const isExpanded = expandedItems.includes(item.name)
            const hasSubItems = "subItems" in item && item.subItems

            const hasAddButton = "addHref" in item && item.addHref

            return (
              <div key={item.name} className="group relative">
                <div className="flex items-center">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "flex-1 gap-3 transition-all",
                      isCollapsed ? "justify-center px-2" : "justify-start",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                    )}
                    onClick={() => {
                      if (hasSubItems && !isCollapsed) {
                        toggleExpand(item.name)
                      } else {
                        router.push(item.href)
                      }
                    }}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Button>
                  
                  {hasAddButton && !isCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(item.addHref!)
                      }}
                      title={`New ${item.name.slice(0, -1)}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {hasAddButton && isCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar-primary text-sidebar-primary-foreground rounded-full shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(item.addHref!)
                      }}
                      title={`New ${item.name.slice(0, -1)}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {hasSubItems && !isCollapsed && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Button
                          key={subItem.href}
                          variant={isSubActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start text-sm",
                            isSubActive
                              ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-primary/50",
                          )}
                          asChild
                        >
                          <Link href={subItem.href}>{subItem.name}</Link>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-sidebar-border">
        {user && !isCollapsed && (
          <div className="mb-4">
            <p className="text-sm text-sidebar-foreground font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/70">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-3 text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
            isCollapsed ? "justify-center px-2" : "justify-start",
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  )
}
