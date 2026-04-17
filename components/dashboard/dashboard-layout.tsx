"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  // Redirect to login when auth check is complete and there is no user
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev
      localStorage.setItem("sidebar-collapsed", String(newValue))
      return newValue
    })
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} />
        <div className="flex-1 flex flex-col">
          <Header onToggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
