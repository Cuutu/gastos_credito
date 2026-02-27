"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMonth, addMonths } from "@/lib/format"

interface MonthPickerProps {
  month: string
  onChange: (month: string) => void
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="Mes anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[140px] text-center text-sm font-medium capitalize">
        {formatMonth(month)}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Mes siguiente"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
