"use client"

import { useState, useEffect } from "react"
import { Bell, X, Check, CheckCheck } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  related_id: string | null
  related_type: string | null
  created_at: string
}

export function NotificationsBell() {
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/portal/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/portal/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
      await fetchNotifications()
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setLoading(true)
      await fetch("/api/portal/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      await fetchNotifications()
    } catch (error) {
      console.error("[v0] Error marking all as read:", error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.related_type === "task" && notification.related_id) {
      // Find transaction by task - for now just go to dashboard
      return "/portal/dashboard"
    }
    return "/portal/dashboard"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-[#78716C] hover:text-[#1E3A5F] transition-colors rounded-lg hover:bg-[#F5F0E8]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-[#E7E5E4] shadow-lg z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#E7E5E4] flex items-center justify-between bg-[#FDFBF7]">
              <h3 className="font-semibold text-[#1C1917]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-[#C9A962] hover:text-[#1E3A5F] font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-[#78716C] hover:text-[#1E3A5F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-[#E7E5E4] mx-auto mb-3" />
                  <p className="text-[#78716C] text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E5E4]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-[#FDFBF7] transition-colors ${
                        !notification.is_read ? "bg-[#F0F9FF]" : ""
                      }`}
                    >
                      <Link
                        href={getNotificationLink(notification)}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id)
                          }
                          setShowDropdown(false)
                        }}
                        className="block"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-[#1C1917] text-sm">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-[#0EA5E9] rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-[#78716C] mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#A8A29E]">
                          {formatDate(notification.created_at)}
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
