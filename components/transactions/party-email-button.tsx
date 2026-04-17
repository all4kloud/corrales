"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mail, X, Loader2, Send, Paperclip } from "lucide-react"

const MAX_TOTAL_MB = 40
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PartyEmailButtonProps {
  transactionId: string
  toEmail: string
  toName: string
  defaultSubject: string
  partyType: string
  partyId?: string
  onEmailSent?: () => void
}

export function PartyEmailButton({
  transactionId,
  toEmail,
  toName,
  defaultSubject,
  partyType,
  partyId,
  onEmailSent,
}: PartyEmailButtonProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState("")
  const [ccInput, setCcInput] = useState("")
  const [ccList, setCcList] = useState<string[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpen = () => {
    setSubject(defaultSubject)
    setBody("")
    setCcInput("")
    setCcList([])
    setAttachments([])
    setError(null)
    setOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (!selected.length) return
    const merged = [...attachments, ...selected].filter(
      (f, i, arr) => arr.findIndex((x) => x.name === f.name && x.size === f.size) === i
    )
    const total = merged.reduce((sum, f) => sum + f.size, 0)
    if (total > MAX_TOTAL_BYTES) {
      setError(`El total de adjuntos supera el límite de ${MAX_TOTAL_MB} MB`)
      return
    }
    setAttachments(merged)
    setError(null)
    // Reset so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
    setError(null)
  }

  const totalBytes = attachments.reduce((sum, f) => sum + f.size, 0)

  const addCc = () => {
    const email = ccInput.trim()
    if (!email) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Dirección CC inválida")
      return
    }
    if (!ccList.includes(email)) setCcList((prev) => [...prev, email])
    setCcInput("")
    setError(null)
  }

  const removeCc = (email: string) => setCcList((prev) => prev.filter((e) => e !== email))

  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addCc()
    }
  }

  const handleSend = async () => {
    if (!body.trim()) {
      setError("El cuerpo del mensaje es requerido")
      return
    }
    setSending(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("to_email", toEmail)
      fd.append("to_name", toName)
      fd.append("cc", JSON.stringify(ccList))
      fd.append("subject", subject)
      fd.append("body", body)
      fd.append("party_type", partyType)
      if (partyId) fd.append("party_id", partyId)
      attachments.forEach((file) => fd.append("attachments", file))

      const res = await fetch(`/api/transactions/${transactionId}/send-email`, {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.details || data.error || "Error al enviar")
        return
      }
      setOpen(false)
      onEmailSent?.()
    } catch {
      setError("Error de conexión")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title={`Enviar correo a ${toName}`}
        className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Mail className="h-3.5 w-3.5" />
        <span className="sr-only">Enviar correo a {toName}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Nuevo correo — {partyType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* To */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Para (To)</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">{toName}</span>
                <span className="text-muted-foreground">{"<"}{toEmail}{">"}</span>
              </div>
            </div>

            {/* CC */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Copias (CC)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="email@ejemplo.com y presiona Enter"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={handleCcKeyDown}
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCc}>
                  Agregar
                </Button>
              </div>
              {ccList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ccList.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1 pr-1 text-xs">
                      {email}
                      <button type="button" onClick={() => removeCc(email)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Asunto</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Mensaje</Label>
              <Textarea
                placeholder="Escriba el mensaje aquí..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="text-sm resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Adjuntos</Label>
                {attachments.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(totalBytes)} / {MAX_TOTAL_MB} MB
                  </span>
                )}
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Adjuntar archivos
              </Button>
              {attachments.length > 0 && (
                <div className="space-y-1.5 mt-1">
                  {attachments.map((file, i) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{file.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar adjunto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSend} disabled={sending || !body.trim()}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
