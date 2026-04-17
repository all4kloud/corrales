"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

export function DateInput({ value, onChange, className, ...props }: DateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange?.(newValue)
  }

  return (
    <Input
      type="date"
      value={value || ""}
      onChange={handleChange}
      className={cn("cursor-pointer", className)}
      {...props}
    />
  )
}
