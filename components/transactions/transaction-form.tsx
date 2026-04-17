"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Check, X, Search, Edit2, Trash2, Phone, FileText, Mail, MailOpen } from "lucide-react"
import Link from "next/link"
import { ClientModal } from "@/components/modals/client-modal"
import { AgentModal } from "@/components/modals/agent-modal"
import { LenderModal } from "@/components/modals/lender-modal"
import { AttorneyModal } from "@/components/modals/attorney-modal"
import { PropertyModal } from "@/components/modals/property-modal"
import { DocumentManager } from "@/components/documents/document-manager"
import { PartyEmailButton } from "@/components/transactions/party-email-button"
import { PartyEmailLog } from "@/components/transactions/party-email-log"

interface TransactionFormProps {
  transactionId?: string
}

interface Property {
  id: string
  address: string
  city: string
  state: string
  zip_code?: string
}

/** Builds the standard email subject: "Address, City, State Zip - Full Name" */
function buildEmailSubject(property: Property | undefined, contactName: string): string {
  const parts = [
    property?.address,
    property?.city,
    [property?.state, property?.zip_code].filter(Boolean).join(" "),
  ].filter(Boolean)
  const fullAddress = parts.join(", ")
  return [fullAddress, contactName].filter(Boolean).join(" - ")
}

/**
 * Returns the primary client label for the transaction:
 * - purchase  → first buyer name (+ "y otros" if multiple)
 * - all others → first seller name (+ "y otros" if multiple)
 */
function getClientLabel(
  transactionType: string,
  buyerIds: string[],
  sellerIds: string[],
  getName: (id: string) => string,
): string {
  const isPurchase = transactionType === "purchase"
  const ids = isPurchase ? buyerIds : sellerIds
  if (ids.length === 0) return ""
  const first = getName(ids[0])
  return ids.length > 1 ? `${first} y otros` : first
}

interface Customer {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  phone?: string | null // Added phone
}

interface Agent {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email?: string
}

interface EntityContact {
  id: string
  contact_name: string
  email?: string
  phone?: string
  role?: string
  is_primary: boolean
}

interface TrackingType {
  id: string
  code: string
  name: string
}

interface TrackingEntry {
  id: string
  tracking_type_id: string
  tracking_type_code: string
  tracking_type_name: string
  description: string | null
  created_by: string
  created_by_first_name: string
  created_by_last_name: string
  created_at: string
}

interface Lender {
  id: string
  company_name: string
  contact_name?: string
  email?: string
  name?: string
  contacts?: EntityContact[]
}

interface Attorney {
  id: string
  firm_name: string
  attorney_name?: string
  email?: string
  phone?: string
  contacts?: EntityContact[]
}

interface OtherEntity {
  id: string
  entity_name: string
  entity_type: string
  email?: string
  contacts?: EntityContact[]
}

const formatCustomerName = (customer: Customer): string => {
  const firstName = String(customer.first_name || "")
  const middleName = customer.middle_name ? String(customer.middle_name) : ""
  const lastName = String(customer.last_name || "")
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Unknown"
}

export function TransactionForm({ transactionId }: TransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [lenders, setLenders] = useState<Lender[]>([])
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [otherEntities, setOtherEntities] = useState<OtherEntity[]>([])
  const [trackingTypes, setTrackingTypes] = useState<TrackingType[]>([])
  const [trackingEntries, setTrackingEntries] = useState<TrackingEntry[]>([])
  const [trackingForm, setTrackingForm] = useState({ tracking_type_id: "", description: "" })
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [lenderModalOpen, setLenderModalOpen] = useState(false)
  const [attorneyModalOpen, setAttorneyModalOpen] = useState(false)
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)

  const [emailLogRefresh, setEmailLogRefresh] = useState(0)

  const [buyerSearch, setBuyerSearch] = useState("")
  const [sellerSearch, setSellerSearch] = useState("")

  const [formData, setFormData] = useState({
    transaction_type: "",
    property_id: "",
    buyer_ids: [] as string[],
    seller_ids: [] as string[],
    listing_agent_id: "",
    co_listing_agent_id: "",
    buyer_agent_id: "", // Renamed from selling_agent_id
    co_buyer_agent_id: "", // Renamed from co_selling_agent_id
    lender_id: "",
    attorney_id: "",
    other_entity_ids: [] as string[],
    purchase_price: "",
    earnest_money: "",
    seller_commission_rate: "",
    buyer_commission_rate: "",
    commission_rate: "",
    commission_flat_fee: "",
    brokerage_fee: "",
    due_diligence_money: "", // Added field
    down_payment: "",
    loan_type: "",
    rate: "",
    status: "pending",
    priority: "medium",
    contract_date: "",
    closing_date: "",
    inspection_date: "",
    appraisal_date: "",
    due_diligence_date: "",
    notes: "",
  })

  useEffect(() => {
    const sellerRate = formData.seller_commission_rate ? Number.parseFloat(formData.seller_commission_rate) : 0
    const buyerRate = formData.buyer_commission_rate ? Number.parseFloat(formData.buyer_commission_rate) : 0
    const totalRate = sellerRate + buyerRate
    setFormData((prev) => ({ ...prev, commission_rate: totalRate > 0 ? totalRate.toFixed(4) : "" }))
  }, [formData.seller_commission_rate, formData.buyer_commission_rate])

useEffect(() => {
    const initializeForm = async () => {
      if (transactionId) {
        setDataLoaded(false)
        await Promise.all([loadEntities(), loadTransaction(), fetchTrackingTypes(), fetchTrackingEntries()])
        setDataLoaded(true)
      } else {
        await Promise.all([loadEntities(), fetchTrackingTypes()])
        setDataLoaded(true)
      }
    }
    initializeForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId])

  // useEffect(() => {
  //   console.log("[v0] Form data state updated:", formData)
  // }, [formData])

  const loadTransaction = async () => {
    try {
      // console.log("[v0] Loading transaction:", transactionId)
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        const data = await response.json()
        // console.log("[v0] Transaction data received:", data)

        if (data.transaction) {
          const transaction = data.transaction
          // console.log("[v0] Transaction data received:", transaction)

          const buyerIds = data.buyers ? data.buyers.map((b: any) => String(b.id)) : []
          const sellerIds = data.sellers ? data.sellers.map((s: any) => String(s.id)) : []
          const otherEntityIds = data.other_entities ? data.other_entities.map((e: any) => String(e.id)) : []

          // console.log("[v0] Extracted buyer IDs:", buyerIds)
          // console.log("[v0] Extracted seller IDs:", sellerIds)

          setFormData((prev) => ({
            ...prev,
            transaction_type: transaction.transaction_type || "",
            property_id: transaction.property_id ? String(transaction.property_id) : "",
            buyer_ids: buyerIds,
            seller_ids: sellerIds,
            listing_agent_id: transaction.listing_agent_id ? String(transaction.listing_agent_id) : "",
            co_listing_agent_id: transaction.co_listing_agent_id ? String(transaction.co_listing_agent_id) : "",
            buyer_agent_id: transaction.buyer_agent_id ? String(transaction.buyer_agent_id) : "", // Renamed from selling_agent_id
            co_buyer_agent_id: transaction.co_buyer_agent_id ? String(transaction.co_buyer_agent_id) : "", // Renamed from co_selling_agent_id
            lender_id: transaction.lender_id ? String(transaction.lender_id) : "",
            attorney_id: transaction.attorney_id ? String(transaction.attorney_id) : "",
            other_entity_ids: otherEntityIds,
            purchase_price: transaction.purchase_price ? String(transaction.purchase_price) : "",
            earnest_money: transaction.earnest_money_deposit
              ? String(transaction.earnest_money_deposit)
              : transaction.earnest_money
                ? String(transaction.earnest_money)
                : "",
            seller_commission_rate: transaction.seller_commission_rate
              ? String(transaction.seller_commission_rate)
              : "",
            buyer_commission_rate: transaction.buyer_commission_rate ? String(transaction.buyer_commission_rate) : "",
            commission_rate: transaction.commission_rate ? String(transaction.commission_rate) : "",
            commission_flat_fee: transaction.commission_flat_fee ? String(transaction.commission_flat_fee) : "",
            closing_fee: transaction.closing_fee ? String(transaction.closing_fee) : "",
            brokerage_fee: transaction.brokerage_fee ? String(transaction.brokerage_fee) : "",
            due_diligence_money: transaction.due_diligence_money ? String(transaction.due_diligence_money) : "", // Added field
            down_payment: transaction.down_payment ? String(transaction.down_payment) : "",
            loan_type: transaction.loan_type || "",
            rate: transaction.rate ? String(transaction.rate) : "",
            status: transaction.status || "pending",
            priority: transaction.priority || "medium",
            contract_date: transaction.contract_date ? transaction.contract_date.split("T")[0] : "",
            closing_date: transaction.closing_date ? transaction.closing_date.split("T")[0] : "",
            inspection_date: transaction.inspection_date ? transaction.inspection_date.split("T")[0] : "",
            appraisal_date: transaction.appraisal_date ? transaction.appraisal_date.split("T")[0] : "",
            due_diligence_date: transaction.due_diligence_date ? transaction.due_diligence_date.split("T")[0] : "",
            notes: transaction.notes || "",
          }))

          // console.log("[v0] Form data set successfully")
        }
      } else {
        console.error("[v0] Failed to fetch transaction:", response.status)
      }
    } catch (error) {
      console.error("Error loading transaction:", error)
    }
  }

  const loadEntities = async () => {
    try {
      const [propertiesRes, customersRes, agentsRes, lendersRes, attorneysRes, otherEntitiesRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/clients"),
        fetch("/api/agents"),
        fetch("/api/lenders"),
        fetch("/api/attorneys"),
        fetch("/api/other-entities"),
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        setProperties(propertiesData.properties || [])
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        const clientsList = (customersData.clients || []).map((c: any) => ({
          ...c,
          id: String(c.id),
          first_name: String(c.first_name || ""),
          middle_name: c.middle_name ? String(c.middle_name) : "",
          last_name: String(c.last_name || ""),
          email: String(c.email || ""),
          phone: c.phone ? String(c.phone) : "", // Ensure phone is a string
        }))
        setCustomers(clientsList)
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        const agentsList = (agentsData.agents || []).map((a: any) => ({
          ...a,
          id: String(a.id),
          first_name: String(a.first_name || ""),
          middle_name: a.middle_name ? String(a.middle_name) : "",
          last_name: String(a.last_name || ""),
        }))
        setAgents(agentsList)
      }

      if (lendersRes.ok) {
        const lendersData = await lendersRes.json()
        setLenders(lendersData.lenders || [])
      }

      if (attorneysRes.ok) {
        const attorneysData = await attorneysRes.json()
        setAttorneys(attorneysData.attorneys || [])
      }

      if (otherEntitiesRes.ok) {
        const oeData = await otherEntitiesRes.json()
        setOtherEntities(oeData.entities || [])
      }
    } catch (error) {
      console.error("Error loading entities:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        transaction_type: formData.transaction_type,
        property_id: formData.property_id || null,
        buyer_ids: formData.buyer_ids,
        seller_ids: formData.seller_ids,
        listing_agent_id: formData.listing_agent_id || null,
        co_listing_agent_id: formData.co_listing_agent_id || null,
        buyer_agent_id: formData.buyer_agent_id || null, // Renamed from selling_agent_id
        co_buyer_agent_id: formData.co_buyer_agent_id || null, // Renamed from co_selling_agent_id
        lender_id: formData.lender_id || null,
        attorney_id: formData.attorney_id || null,
        other_entity_ids: formData.other_entity_ids,
        purchase_price: formData.purchase_price ? Number.parseFloat(formData.purchase_price) : null,
        earnest_money_deposit: formData.earnest_money ? Number.parseFloat(formData.earnest_money) : null,
        due_diligence_money: formData.due_diligence_money ? Number.parseFloat(formData.due_diligence_money) : null, // Added field
        seller_commission_rate: formData.seller_commission_rate
          ? Number.parseFloat(formData.seller_commission_rate)
          : null,
        buyer_commission_rate: formData.buyer_commission_rate
          ? Number.parseFloat(formData.buyer_commission_rate)
          : null,
        commission_rate: formData.commission_rate ? Number.parseFloat(formData.commission_rate) : null,
        commission_flat_fee: formData.commission_flat_fee ? Number.parseFloat(formData.commission_flat_fee) : null,
        closing_fee: formData.closing_fee ? Number.parseFloat(formData.closing_fee) : null,
        brokerage_fee: formData.brokerage_fee ? Number.parseFloat(formData.brokerage_fee) : null,
        down_payment: formData.down_payment ? Number.parseFloat(formData.down_payment) : null,
        loan_type: formData.loan_type || null,
        rate: formData.rate ? Number.parseFloat(formData.rate) : null,
        status: formData.status,
        priority: formData.priority,
        contract_date: formData.contract_date || null,
        closing_date: formData.closing_date || null,
        inspection_date: formData.inspection_date || null,
        appraisal_date: formData.appraisal_date || null,
        due_diligence_date: formData.due_diligence_date || null,
        notes: formData.notes || "",
      }

      const url = transactionId ? `/api/transactions/${transactionId}` : "/api/transactions"
      const method = transactionId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        if (transactionId) {
          // Stay on the same transaction after update
          router.push(`/dashboard/transactions/${transactionId}/edit`)
        } else {
          router.push("/dashboard/transactions")
        }
      } else {
        const data = await response.json()
        alert(data.error || "Failed to save transaction")
      }
    } catch (error) {
      console.error("Error saving transaction:", error)
      alert("Failed to save transaction")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        const clientsList = (data.clients || []).map((c: any) => ({
          ...c,
          id: String(c.id),
          first_name: String(c.first_name || ""),
          middle_name: c.middle_name ? String(c.middle_name) : "",
          last_name: String(c.last_name || ""),
          email: String(c.email || ""),
          phone: c.phone ? String(c.phone) : "", // Ensure phone is a string
        }))
        setCustomers(clientsList)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        const agentsList = (data.agents || []).map((a: any) => ({
          ...a,
          id: String(a.id),
          first_name: String(a.first_name || ""),
          middle_name: a.middle_name ? String(a.middle_name) : "",
          last_name: String(a.last_name || ""),
        }))
        setAgents(agentsList)
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
    }
  }, [])

  const fetchLenders = useCallback(async () => {
    try {
      const response = await fetch("/api/lenders")
      if (response.ok) {
        const data = await response.json()
        setLenders(data.lenders || [])
      }
    } catch (error) {
      console.error("Error fetching lenders:", error)
    }
  }, [])

  const fetchAttorneys = useCallback(async () => {
    try {
      const response = await fetch("/api/attorneys")
      if (response.ok) {
        const data = await response.json()
        setAttorneys(data.attorneys || [])
      }
    } catch (error) {
      console.error("Error fetching attorneys:", error)
    }
  }, [])

  const fetchProperties = useCallback(async () => {
    try {
      const response = await fetch("/api/properties")
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    }
  }, [])

  const fetchTrackingTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/tracking-types")
      if (response.ok) {
        const data = await response.json()
        setTrackingTypes(data)
      }
    } catch (error) {
      console.error("Error fetching tracking types:", error)
    }
  }, [])

  const fetchTrackingEntries = useCallback(async () => {
    if (!transactionId) return
    try {
      const response = await fetch(`/api/transactions/${transactionId}/tracking`)
      if (response.ok) {
        const data = await response.json()
        setTrackingEntries(data)
      }
    } catch (error) {
      console.error("Error fetching tracking entries:", error)
    }
  }, [transactionId])

  const handleSaveTracking = async () => {
    if (!transactionId || !trackingForm.tracking_type_id) return
    setTrackingLoading(true)
    try {
      const url = editingTrackingId
        ? `/api/transactions/${transactionId}/tracking/${editingTrackingId}`
        : `/api/transactions/${transactionId}/tracking`
      const method = editingTrackingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingForm),
      })

      if (response.ok) {
        setTrackingForm({ tracking_type_id: "", description: "" })
        setEditingTrackingId(null)
        fetchTrackingEntries()
      }
    } catch (error) {
      console.error("Error saving tracking entry:", error)
    } finally {
      setTrackingLoading(false)
    }
  }

  const handleEditTracking = (entry: TrackingEntry) => {
    setEditingTrackingId(entry.id)
    setTrackingForm({
      tracking_type_id: entry.tracking_type_id,
      description: entry.description || "",
    })
  }

  const handleDeleteTracking = async (entryId: string) => {
    if (!transactionId) return
    try {
      const response = await fetch(`/api/transactions/${transactionId}/tracking/${entryId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchTrackingEntries()
      }
    } catch (error) {
      console.error("Error deleting tracking entry:", error)
    }
  }

  const handleCancelEditTracking = () => {
    setEditingTrackingId(null)
    setTrackingForm({ tracking_type_id: "", description: "" })
  }

  const getTrackingIcon = (code: string) => {
    switch (code) {
      case "make_calls": return <Phone className="h-4 w-4" />
      case "review_documents": return <FileText className="h-4 w-4" />
      case "send_emails": return <Mail className="h-4 w-4" />
      case "read_emails": return <MailOpen className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleToggleBuyer = (customerId: string) => {
    const id = String(customerId)
    setFormData((prev) => {
      const currentIds = prev.buyer_ids || []
      const isSelected = currentIds.includes(id)
      return {
        ...prev,
        buyer_ids: isSelected ? currentIds.filter((i) => i !== id) : [...currentIds, id],
      }
    })
  }

  const handleToggleSeller = (customerId: string) => {
    const id = String(customerId)
    setFormData((prev) => {
      const currentIds = prev.seller_ids || []
      const isSelected = currentIds.includes(id)
      return {
        ...prev,
        seller_ids: isSelected ? currentIds.filter((i) => i !== id) : [...currentIds, id],
      }
    })
  }

  const getCustomerNameById = (id: string): string => {
    const customer = customers.find((c) => c.id === id)
    return customer ? formatCustomerName(customer) : "Unknown"
  }

  const formatAgentName = (agent: Agent): string => {
    const firstName = String(agent.first_name || "")
    const middleName = agent.middle_name ? String(agent.middle_name) : ""
    const lastName = String(agent.last_name || "")
    return [firstName, middleName, lastName].filter(Boolean).join(" ").trim() || "Unknown"
  }

  const filteredBuyers = customers.filter((customer) => {
    if (!buyerSearch) return true
    const searchLower = buyerSearch.toLowerCase()
    const fullName = formatCustomerName(customer).toLowerCase()
    return (
      fullName.includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    )
  })

  const filteredSellers = customers.filter((customer) => {
    if (!sellerSearch) return true
    const searchLower = sellerSearch.toLowerCase()
    const fullName = formatCustomerName(customer).toLowerCase()
    return (
      fullName.includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    )
  })

  const isFormValid = () => {
    // Required fields: transaction_type, at least one buyer OR seller, property, and contract date
    const hasTransactionType = formData.transaction_type.trim() !== ""
    const hasProperty = formData.property_id !== null && formData.property_id !== ""
    const hasContractDate = formData.contract_date !== null && formData.contract_date !== ""

    // Conditional requirements based on transaction type
    if (formData.transaction_type === "purchase") {
      // For purchases, buyers are required
      return hasTransactionType && formData.buyer_ids.length > 0 && hasProperty && hasContractDate
    } else if (formData.transaction_type === "sale") {
      // For sales, sellers are required
      return hasTransactionType && formData.seller_ids.length > 0 && hasProperty && hasContractDate
    } else {
      // For other types (lease, etc.), require both
      return (
        hasTransactionType &&
        formData.buyer_ids.length > 0 &&
        formData.seller_ids.length > 0 &&
        hasProperty &&
        hasContractDate
      )
    }
  }

  return (
    <div className="space-y-6">
      {dataLoaded && (
        <>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{transactionId ? "Edit Transaction" : "New Transaction"}</h1>
              <p className="text-muted-foreground">
                {transactionId ? "Update transaction details" : "Create a new real estate transaction"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="parties">Parties</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="dates">Key Dates</TabsTrigger>
                <TabsTrigger value="tracking" disabled={!transactionId}>Tracking</TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Enter the basic details of the transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="transaction_type">Transaction Type *</Label>
                        <Select
                          value={formData.transaction_type}
                          onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sale">Sale</SelectItem>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="lease">Lease</SelectItem>
                            <SelectItem value="rental">Rental</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="property_id">Property</Label>
                        <div className="flex gap-2">
                          <Select
                            value={formData.property_id}
                            onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.address}, {property.city}, {property.state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setPropertyModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        placeholder="Additional notes about this transaction"
                      />
                    </div>

{transactionId && (
  <div className="pt-4">
  <DocumentManager transactionId={transactionId} transactionStatus={formData.status} />
  </div>
  )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parties">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Parties</CardTitle>
                    <CardDescription>Select the parties involved in this transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Buyers Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Buyers{" "}
                          {formData.transaction_type === "purchase" || formData.transaction_type === "lease" ? "*" : ""}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setClientModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add New Client
                        </Button>
                      </div>

                      {formData.buyer_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted rounded-md">
                          {formData.buyer_ids.map((id) => {
                            const customer = customers.find((c) => c.id === id)
                            const property = properties.find((p) => p.id === formData.property_id)
                            const clientLabel = getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById)
                            const defaultSubject = buildEmailSubject(property, clientLabel)
                            return (
                              <span
                                key={`buyer-badge-${id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-sm rounded-md"
                              >
                                {getCustomerNameById(id)}
                                {transactionId && customer?.email && (
                                  <span className="text-primary-foreground/80 hover:text-primary-foreground">
                                    <PartyEmailButton
                                      transactionId={transactionId}
                                      toEmail={customer.email}
                                      toName={getCustomerNameById(id)}
                                      defaultSubject={defaultSubject}
                                      partyType="Buyer"
                                      partyId={id}
                                      onEmailSent={() => setEmailLogRefresh((n) => n + 1)}
                                    />
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleBuyer(id)}
                                  className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search buyers by name, email, or phone..."
                          value={buyerSearch}
                          onChange={(e) => setBuyerSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {filteredBuyers.length === 0 ? (
                          <p className="p-4 text-center text-muted-foreground">
                            {buyerSearch
                              ? "No clients found matching your search."
                              : "No clients available. Add a new client first."}
                          </p>
                        ) : (
                          filteredBuyers.map((customer) => {
                            const isSelected = formData.buyer_ids.includes(customer.id)
                            return (
                              <div
                                key={`buyer-${customer.id}`}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                                  isSelected ? "bg-primary/10" : "hover:bg-accent"
                                }`}
                                onClick={() => handleToggleBuyer(customer.id)}
                              >
                                <span className="text-sm">{formatCustomerName(customer)}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            )
                          })
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formData.buyer_ids.length} buyer(s) selected</p>
                    </div>

                    {/* Sellers Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>
                          Sellers{" "}
                          {formData.transaction_type === "sale" || formData.transaction_type === "lease" ? "*" : ""}
                        </Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setClientModalOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add New Client
                        </Button>
                      </div>

                      {formData.seller_ids.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted rounded-md">
                          {formData.seller_ids.map((id) => {
                            const customer = customers.find((c) => c.id === id)
                            const property = properties.find((p) => p.id === formData.property_id)
                            const propertyAddress = property ? property.address : ""
                            const clientLabel = getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById)
                            const defaultSubject = buildEmailSubject(property, clientLabel)
                            return (
                              <span
                                key={`seller-badge-${id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-sm rounded-md"
                              >
                                {getCustomerNameById(id)}
                                {transactionId && customer?.email && (
                                  <span className="text-primary-foreground/80 hover:text-primary-foreground">
                                    <PartyEmailButton
                                      transactionId={transactionId}
                                      toEmail={customer.email}
                                      toName={getCustomerNameById(id)}
                                      defaultSubject={defaultSubject}
                                      partyType="Seller"
                                      partyId={id}
                                      onEmailSent={() => setEmailLogRefresh((n) => n + 1)}
                                    />
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSeller(id)}
                                  className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search sellers by name, email, or phone..."
                          value={sellerSearch}
                          onChange={(e) => setSellerSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {filteredSellers.length === 0 ? (
                          <p className="p-4 text-center text-muted-foreground">
                            {sellerSearch
                              ? "No clients found matching your search."
                              : "No clients available. Add a new client first."}
                          </p>
                        ) : (
                          filteredSellers.map((customer) => {
                            const isSelected = formData.seller_ids.includes(customer.id)
                            return (
                              <div
                                key={`seller-${customer.id}`}
                                className={`flex items-center justify-between px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors ${
                                  isSelected ? "bg-primary/10" : "hover:bg-accent"
                                }`}
                                onClick={() => handleToggleSeller(customer.id)}
                              >
                                <span className="text-sm">{formatCustomerName(customer)}</span>
                                {isSelected && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            )
                          })
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{formData.seller_ids.length} seller(s) selected</p>
                    </div>

                    {/* Agents Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="listing_agent_id">Listing Agent</Label>
                          {transactionId && formData.listing_agent_id && (() => {
                            const agent = agents.find((a) => a.id === formData.listing_agent_id)
                            const property = properties.find((p) => p.id === formData.property_id)
          const subject = buildEmailSubject(property, getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById))
            return agent?.email ? (
              <PartyEmailButton transactionId={transactionId} toEmail={agent.email} toName={`${agent.first_name} ${agent.last_name}`} defaultSubject={subject} partyType="Listing Agent" partyId={agent.id} onEmailSent={() => setEmailLogRefresh((n) => n + 1)} />
                            ) : null
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={formData.listing_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, listing_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select listing agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="co_listing_agent_id">Co-listing Agent</Label>
                          {transactionId && formData.co_listing_agent_id && (() => {
                            const agent = agents.find((a) => a.id === formData.co_listing_agent_id)
                            const property = properties.find((p) => p.id === formData.property_id)
          const subject = buildEmailSubject(property, getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById))
            return agent?.email ? (
              <PartyEmailButton transactionId={transactionId} toEmail={agent.email} toName={`${agent.first_name} ${agent.last_name}`} defaultSubject={subject} partyType="Co-Listing Agent" partyId={agent.id} onEmailSent={() => setEmailLogRefresh((n) => n + 1)} />
                            ) : null
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={formData.co_listing_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, co_listing_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select co-listing agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="buyer_agent_id">Buyer Agent</Label>
                          {transactionId && formData.buyer_agent_id && (() => {
                            const agent = agents.find((a) => a.id === formData.buyer_agent_id)
                            const property = properties.find((p) => p.id === formData.property_id)
          const subject = buildEmailSubject(property, getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById))
            return agent?.email ? (
              <PartyEmailButton transactionId={transactionId} toEmail={agent.email} toName={`${agent.first_name} ${agent.last_name}`} defaultSubject={subject} partyType="Buyer Agent" partyId={agent.id} onEmailSent={() => setEmailLogRefresh((n) => n + 1)} />
                            ) : null
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={formData.buyer_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, buyer_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select buyer agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="co_buyer_agent_id">Co-buyer Agent</Label>
                          {transactionId && formData.co_buyer_agent_id && (() => {
                            const agent = agents.find((a) => a.id === formData.co_buyer_agent_id)
                            const property = properties.find((p) => p.id === formData.property_id)
          const subject = buildEmailSubject(property, getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById))
            return agent?.email ? (
              <PartyEmailButton transactionId={transactionId} toEmail={agent.email} toName={`${agent.first_name} ${agent.last_name}`} defaultSubject={subject} partyType="Co-Buyer Agent" partyId={agent.id} onEmailSent={() => setEmailLogRefresh((n) => n + 1)} />
                            ) : null
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={formData.co_buyer_agent_id}
                            onValueChange={(value) => setFormData({ ...formData, co_buyer_agent_id: value })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select co-buyer agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {formatAgentName(agent)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setAgentModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lender Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="lender_id">Lender</Label>
                        {transactionId && formData.lender_id && (() => {
                          const lender = lenders.find((l) => l.id === formData.lender_id)
          const primaryContact = lender?.contacts?.find((c) => c.is_primary) || lender?.contacts?.[0]
          const contactEmail = primaryContact?.email || lender?.email
          const contactName = primaryContact?.contact_name || lender?.contact_name || lender?.company_name || ""
                          const property = properties.find((p) => p.id === formData.property_id)
          const subject = buildEmailSubject(property, getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById))
          return contactEmail && lender ? (
                            <PartyEmailButton transactionId={transactionId} toEmail={contactEmail} toName={contactName} defaultSubject={subject} partyType="Lender" partyId={lender.id} onEmailSent={() => setEmailLogRefresh((n) => n + 1)} />
                          ) : null
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={formData.lender_id}
                          onValueChange={(value) => setFormData({ ...formData, lender_id: value })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select lender" />
                          </SelectTrigger>
                          <SelectContent>
                        {lenders.map((lender) => {
                          const primaryContact = lender.contacts?.find((c) => c.is_primary) || lender.contacts?.[0]
                          const contactDisplay = primaryContact?.contact_name || lender.contact_name || ""
                          return (
                            <SelectItem key={lender.id} value={lender.id}>
                              {lender.company_name}{contactDisplay ? ` - ${contactDisplay}` : ""}
                            </SelectItem>
                          )
                        })}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setLenderModalOpen(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Attorney Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="attorney_id">Attorney</Label>
                        {transactionId && formData.attorney_id && (() => {
                          const attorney = attorneys.find((a) => a.id === formData.attorney_id)
                          const primaryContact = attorney?.contacts?.find((c) => c.is_primary) || attorney?.contacts?.[0]
                          const contactEmail = primaryContact?.email || attorney?.email
                          const contactName = primaryContact?.contact_name || attorney?.attorney_name || attorney?.firm_name || ""
                          const property = properties.find((p) => p.id === formData.property_id)
          const subject = buildEmailSubject(property, getClientLabel(formData.transaction_type, formData.buyer_ids, formData.seller_ids, getCustomerNameById))
          return contactEmail && attorney ? (
                            <PartyEmailButton transactionId={transactionId} toEmail={contactEmail} toName={contactName} defaultSubject={subject} partyType="Attorney" partyId={attorney.id} onEmailSent={() => setEmailLogRefresh((n) => n + 1)} />
                          ) : null
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={formData.attorney_id}
                          onValueChange={(value) => setFormData({ ...formData, attorney_id: value })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select attorney" />
                          </SelectTrigger>
                          <SelectContent>
                        {attorneys.map((attorney) => {
                          const primaryContact = attorney.contacts?.find((c) => c.is_primary) || attorney.contacts?.[0]
                          const contactDisplay = primaryContact?.contact_name || attorney.attorney_name || ""
                          return (
                            <SelectItem key={attorney.id} value={attorney.id}>
                              {attorney.firm_name}{contactDisplay ? ` - ${contactDisplay}` : ""}
                            </SelectItem>
                          )
                        })}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setAttorneyModalOpen(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Other Entities — Insurance, Appraisal, Title, Contractor */}
                    {(() => {
                      const ENTITY_TYPE_LABELS: Record<string, string> = {
                        insurance:   "Insurance",
                        appraisal:   "Appraisal",
                        title:       "Title Company",
                        contractor:  "Contractor",
                        other:       "Other",
                      }
                      // Group entities by type for clearer display
                      const grouped = otherEntities.reduce<Record<string, OtherEntity[]>>((acc, e) => {
                        const key = e.entity_type || "other"
                        ;(acc[key] = acc[key] || []).push(e)
                        return acc
                      }, {})
                      const typeOrder = ["insurance", "appraisal", "title", "contractor", "other"]
                      const sortedTypes = [
                        ...typeOrder.filter((t) => grouped[t]),
                        ...Object.keys(grouped).filter((t) => !typeOrder.includes(t)),
                      ]
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Other Entities</Label>
                            <a
                              href="/dashboard/other-entities/new"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline"
                            >
                              + Add new entity
                            </a>
                          </div>
                          {otherEntities.length === 0 ? (
                            <p className="text-sm text-muted-foreground border rounded-md p-3">
                              No entities found. Create them in{" "}
                              <a href="/dashboard/other-entities/new" className="underline" target="_blank" rel="noreferrer">
                                Other Entities
                              </a>
                              .
                            </p>
                          ) : (
                            <div className="border rounded-md divide-y overflow-hidden">
                              {sortedTypes.map((type) => (
                                <div key={type}>
                                  <div className="px-3 py-1 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {ENTITY_TYPE_LABELS[type] ?? type}
                                  </div>
                                  {grouped[type].map((entity) => (
                                    <label
                                      key={entity.id}
                                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50"
                                    >
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-input"
                                        checked={formData.other_entity_ids.includes(entity.id)}
                                        onChange={(e) => {
                                          const ids = formData.other_entity_ids
                                          setFormData({
                                            ...formData,
                                            other_entity_ids: e.target.checked
                                              ? [...ids, entity.id]
                                              : ids.filter((id) => id !== entity.id),
                                          })
                                        }}
                                      />
                                      <span className="flex-1 text-sm">{entity.entity_name}</span>
                                    </label>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          {formData.other_entity_ids.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {formData.other_entity_ids.length} entit{formData.other_entity_ids.length === 1 ? "y" : "ies"} selected
                            </p>
                          )}
                        </div>
                      )
                    })()}

                    {/* Email trazability log */}
                    {transactionId && (
                      <PartyEmailLog
                        transactionId={transactionId}
                        refreshTrigger={emailLogRefresh}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Details</CardTitle>
                    <CardDescription>Enter the financial information for this transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                        <Input
                          id="purchase_price"
                          type="number"
                          step="0.01"
                          value={formData.purchase_price}
                          onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="earnest_money">Earnest Money ($)</Label>
                        <Input
                          id="earnest_money"
                          type="number"
                          step="0.01"
                          value={formData.earnest_money}
                          onChange={(e) => setFormData({ ...formData, earnest_money: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="seller_commission_rate">Seller Commission Rate (%)</Label>
                        <Input
                          id="seller_commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.seller_commission_rate}
                          onChange={(e) => setFormData({ ...formData, seller_commission_rate: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="buyer_commission_rate">Buyer Commission Rate (%)</Label>
                        <Input
                          id="buyer_commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.buyer_commission_rate}
                          onChange={(e) => setFormData({ ...formData, buyer_commission_rate: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commission_rate">Total Commission Rate (%) - Readonly</Label>
                        <Input
                          id="commission_rate"
                          type="number"
                          step="0.01"
                          value={formData.commission_rate}
                          readOnly
                          className="bg-muted"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="due_diligence_money">Due Diligence Money ($)</Label>
                        <Input
                          id="due_diligence_money"
                          type="number"
                          step="0.01"
                          value={formData.due_diligence_money}
                          onChange={(e) => setFormData({ ...formData, due_diligence_money: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="brokerage_fee">Brokerage Fee ($)</Label>
                        <Input
                          id="brokerage_fee"
                          type="number"
                          step="0.01"
                          value={formData.brokerage_fee}
                          onChange={(e) => setFormData({ ...formData, brokerage_fee: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="commission_flat_fee">Commission Flat Fee ($)</Label>
                        <Input
                          id="commission_flat_fee"
                          type="number"
                          step="0.01"
                          value={formData.commission_flat_fee}
                          onChange={(e) => setFormData({ ...formData, commission_flat_fee: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="closing_fee">Closing Fee ($)</Label>
                        <Input
                          id="closing_fee"
                          type="number"
                          step="0.01"
                          value={formData.closing_fee}
                          onChange={(e) => setFormData({ ...formData, closing_fee: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Loan Info Section */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">Loan Info</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="down_payment">Down Payment ($)</Label>
                          <Input
                            id="down_payment"
                            type="number"
                            step="0.01"
                            value={formData.down_payment}
                            onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="loan_type">Loan Type</Label>
                          <Select
                            value={formData.loan_type}
                            onValueChange={(value) => setFormData({ ...formData, loan_type: value })}
                          >
                            <SelectTrigger id="loan_type">
                              <SelectValue placeholder="Select loan type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conventional">Conventional</SelectItem>
                              <SelectItem value="usda">USDA</SelectItem>
                              <SelectItem value="fha">FHA</SelectItem>
                              <SelectItem value="dscr">DSCR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rate">Interest Rate (%)</Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.0001"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            placeholder="0.0000"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dates" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contract_date">Contract Date</Label>
                      <DateInput
                        id="contract_date"
                        value={formData.contract_date}
                        onChange={(value) => setFormData({ ...formData, contract_date: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="closing_date">Closing Date</Label>
                      <DateInput
                        id="closing_date"
                        value={formData.closing_date}
                        onChange={(value) => setFormData({ ...formData, closing_date: value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="due_diligence_date">Due Diligence Date</Label>
                      <DateInput
                        id="due_diligence_date"
                        value={formData.due_diligence_date}
                        onChange={(value) => setFormData({ ...formData, due_diligence_date: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inspection_date">Inspection Date</Label>
                      <DateInput
                        id="inspection_date"
                        value={formData.inspection_date}
                        onChange={(value) => setFormData({ ...formData, inspection_date: value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appraisal_date">Appraisal Date</Label>
                      <DateInput
                        id="appraisal_date"
                        value={formData.appraisal_date}
                        onChange={(value) => setFormData({ ...formData, appraisal_date: value })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tracking">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Tracking</CardTitle>
                    <CardDescription>Record and track activities related to this transaction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add/Edit Form */}
                    <div className="p-4 border border-border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-3">{editingTrackingId ? "Edit Entry" : "New Entry"}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tracking_type">Activity Type *</Label>
                          <Select
                            value={trackingForm.tracking_type_id}
                            onValueChange={(value) => setTrackingForm({ ...trackingForm, tracking_type_id: value })}
                          >
                            <SelectTrigger id="tracking_type">
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                            <SelectContent>
                              {trackingTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tracking_description">Description</Label>
                          <Input
                            id="tracking_description"
                            value={trackingForm.description}
                            onChange={(e) => setTrackingForm({ ...trackingForm, description: e.target.value })}
                            placeholder="Optional notes about this activity"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        {editingTrackingId && (
                          <Button type="button" variant="outline" onClick={handleCancelEditTracking}>
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={handleSaveTracking}
                          disabled={!trackingForm.tracking_type_id || trackingLoading}
                        >
                          {trackingLoading ? "Saving..." : editingTrackingId ? "Update" : "Add Entry"}
                        </Button>
                      </div>
                    </div>

                    {/* Entries List */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Activity History</h4>
                      {trackingEntries.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4 text-center">No activities recorded yet</p>
                      ) : (
                        <div className="space-y-2">
                          {trackingEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="mt-0.5 text-muted-foreground">
                                {getTrackingIcon(entry.tracking_type_code)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{entry.tracking_type_name}</span>
                                </div>
                                {entry.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {entry.created_by_first_name} {entry.created_by_last_name} •{" "}
                                  {new Date(entry.created_at).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditTracking(entry)}
                                  title="Edit"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTracking(entry.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-6">
              <Link href="/dashboard/transactions">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !isFormValid()}>
                {loading ? "Saving..." : transactionId ? "Update Transaction" : "Create Transaction"}
              </Button>
            </div>
          </form>

          {/* Floating Save Button */}
          {transactionId && (
            <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  const form = document.querySelector('form') as HTMLFormElement
                  if (form) {
                    form.requestSubmit()
                  }
                }}
                disabled={loading || !isFormValid()}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                {loading ? "Saving..." : "Update Transaction"}
              </Button>
            </div>
          )}
        </>
      )}
      {/* Modals */}
      <ClientModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        onSuccess={() => {
          fetchCustomers()
          setClientModalOpen(false)
        }}
      />
      <AgentModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        onSuccess={() => {
          fetchAgents()
          setAgentModalOpen(false)
        }}
      />
      <LenderModal
        open={lenderModalOpen}
        onOpenChange={setLenderModalOpen}
        onSuccess={() => {
          fetchLenders()
          setLenderModalOpen(false)
        }}
      />
      <AttorneyModal
        open={attorneyModalOpen}
        onOpenChange={setAttorneyModalOpen}
        onSuccess={() => {
          fetchAttorneys()
          setAttorneyModalOpen(false)
        }}
      />
      <PropertyModal
        open={propertyModalOpen}
        onOpenChange={setPropertyModalOpen}
        onSuccess={() => {
          fetchProperties()
          setPropertyModalOpen(false)
        }}
      />
    </div>
  )
}
