"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Check, Globe } from "lucide-react"

interface LanguageSelectorProps {
  currentLanguage: string
  onLanguageChange: (language: string) => void
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync state when currentLanguage prop changes
  useEffect(() => {
    setSelectedLanguage(currentLanguage)
  }, [currentLanguage])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const response = await fetch("/api/portal/settings/language", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredLanguage: selectedLanguage }),
      })

      if (response.ok) {
        setSaved(true)
        onLanguageChange(selectedLanguage)
        
        // Reload page to apply language changes
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        alert("Error saving language preference")
      }
    } catch (error) {
      console.error("Error saving language:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Language / Idioma</CardTitle>
        </div>
        <CardDescription>
          Select your preferred language for the portal interface / Selecciona tu idioma preferido
          para la interfaz del portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="es" id="es" />
            <Label htmlFor="es" className="flex-1 cursor-pointer">
              <div className="font-medium">Español</div>
              <div className="text-sm text-muted-foreground">
                Interfaz en español para usuarios hispanohablantes
              </div>
            </Label>
            {selectedLanguage === "es" && <Check className="h-5 w-5 text-primary" />}
          </div>

          <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="en" id="en" />
            <Label htmlFor="en" className="flex-1 cursor-pointer">
              <div className="font-medium">English</div>
              <div className="text-sm text-muted-foreground">
                English interface for English-speaking users
              </div>
            </Label>
            {selectedLanguage === "en" && <Check className="h-5 w-5 text-primary" />}
          </div>
        </RadioGroup>

        {selectedLanguage !== currentLanguage && (
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving... / Guardando..." : saved ? "Saved! / Guardado!" : "Save Changes / Guardar Cambios"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedLanguage(currentLanguage)}
              disabled={saving}
            >
              Cancel / Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
