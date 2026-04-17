import { useState, useEffect } from "react"

type Messages = Record<string, string | Record<string, string>>

export function useTranslations() {
  const [messages, setMessages] = useState<Messages>({})
  const [locale, setLocale] = useState<"en" | "es">("es")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTranslations()
  }, [])

  const loadTranslations = async () => {
    try {
      // Get user's language preference from API
      const response = await fetch("/api/portal/auth/me")
      if (response.ok) {
        const data = await response.json()
        const preferredLanguage = data.user?.preferredLanguage || "es"
        
        // Load translation messages
        const messagesModule = await import(`@/messages/${preferredLanguage}.json`)
        setMessages(messagesModule.default)
        setLocale(preferredLanguage as "en" | "es")
      } else {
        // Default to Spanish if not authenticated
        const messagesModule = await import(`@/messages/es.json`)
        setMessages(messagesModule.default)
      }
    } catch (error) {
      console.error("Error loading translations:", error)
      // Fallback to Spanish
      const messagesModule = await import(`@/messages/es.json`)
      setMessages(messagesModule.default)
    } finally {
      setLoading(false)
    }
  }

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = messages

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key
  }

  // Helper to translate status
  const translateStatus = (status: string): string => {
    if (!status) return status
    const normalized = status.toLowerCase().replace(/ /g, "_")
    return t(`status.${normalized}`) || status.replace(/_/g, " ")
  }

  // Helper to translate role
  const translateRole = (role: string): string => {
    if (!role) return role
    const normalized = role.toLowerCase().replace(/ /g, "_")
    return t(`roles.${normalized}`) || role.replace(/_/g, " ")
  }

  return { t, locale, loading, refresh: loadTranslations, translateStatus, translateRole }
}
