"use client"

import { useState, useTransition, useEffect } from "react"
import { format } from "date-fns"
import { addMonths } from "@/lib/format"
import { es } from "date-fns/locale"
import { CalendarIcon, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createExpense, updateExpense } from "@/lib/actions/expenses"
import type { Person, ExpenseWithPerson } from "@/lib/types"
import { toast } from "sonner"

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persons: Person[]
  expense?: ExpenseWithPerson | null
  onSuccess?: (firstDueMonth?: string) => void
}

export function ExpenseForm({
  open,
  onOpenChange,
  persons,
  expense,
  onSuccess,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!expense

  const [merchant, setMerchant] = useState("")
  const [amountMode, setAmountMode] = useState<"total" | "per_installment">("per_installment")
  const [amountTotal, setAmountTotal] = useState("")
  const [amountPerInstallment, setAmountPerInstallment] = useState("")
  const [installments, setInstallments] = useState(1)
  const [firstInstallment, setFirstInstallment] = useState(1)
  const [personId, setPersonId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined)
  const [card, setCard] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (firstInstallment > installments) {
      setFirstInstallment(installments)
    }
  }, [installments, firstInstallment])

  // Sincronizar monto total cuando cambian cuotas en modo "por cuota"
  useEffect(() => {
    if (amountMode === "per_installment" && amountPerInstallment) {
      const n = parseFloat(amountPerInstallment)
      if (!isNaN(n) && installments > 0) {
        setAmountTotal((n * installments).toFixed(2))
      }
    }
  }, [amountMode, amountPerInstallment, installments])

  useEffect(() => {
    if (open) {
      if (expense) {
        setMerchant(expense.merchant)
        setAmountTotal(parseFloat(expense.amount_total).toString())
        const perInst = parseFloat(expense.amount_total) / expense.installments
        setAmountPerInstallment(perInst.toFixed(2))
        setInstallments(expense.installments)
        setFirstInstallment(
          (expense as ExpenseWithPerson & { first_installment?: number })
            .first_installment ?? 1
        )
        setPersonId(expense.person_id.toString())
        setPurchaseDate(new Date(expense.purchase_date + "T00:00:00"))
        setCard(expense.card || "")
        setNotes(expense.notes || "")
        setAmountMode("total")
      } else {
        setMerchant("")
        setAmountTotal("")
        setAmountPerInstallment("")
        setInstallments(1)
        setFirstInstallment(1)
        setPersonId("")
        setPurchaseDate(new Date())
        setCard("")
        setNotes("")
        setAmountMode("per_installment")
      }
      setErrors({})
    }
  }, [open, expense])

  function handleSubmit() {
    const newErrors: Record<string, string> = {}
    if (!merchant.trim()) newErrors.merchant = "Obligatorio"
    if (!personId) newErrors.personId = "Seleccione persona"
    if (!purchaseDate) newErrors.purchaseDate = "Seleccione fecha"
    if (firstInstallment > installments)
      newErrors.firstInstallment =
        "La cuota inicial no puede ser mayor al total"

    const amount = parseFloat(amountTotal)
    const perInst = parseFloat(amountPerInstallment)
    if (amountMode === "total") {
      if (isNaN(amount) || amount <= 0) newErrors.amountTotal = "Monto inválido"
    } else {
      if (isNaN(perInst) || perInst <= 0)
        newErrors.amountPerInstallment = "Monto por cuota inválido"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const formData = {
      merchant: merchant.trim(),
      ...(amountMode === "total"
        ? { amount_total: amount }
        : { amount_per_installment: perInst }),
      installments,
      first_installment: firstInstallment,
      person_id: parseInt(personId),
      purchase_date: format(purchaseDate!, "yyyy-MM-dd"),
      card: card.trim() || null,
      notes: notes.trim() || null,
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateExpense(expense!.id, formData)
        : await createExpense(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? "Gasto actualizado" : "Gasto creado")
        const purchaseMonth = format(purchaseDate!, "yyyy-MM")
        const firstMonth =
          firstInstallment === 1
            ? purchaseMonth
            : addMonths(purchaseMonth, firstInstallment - 1)
        onSuccess?.(firstMonth)
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar gasto" : "Nuevo gasto"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Comercio */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="merchant">Comercio</Label>
            <Input
              id="merchant"
              placeholder="Ej: Mercado Libre"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value)
                setErrors((p) => ({ ...p, merchant: "" }))
              }}
              aria-invalid={!!errors.merchant}
            />
            {errors.merchant && (
              <p className="text-xs text-destructive">{errors.merchant}</p>
            )}
          </div>

          {/* Modo de monto: total o por cuota */}
          <div className="flex flex-col gap-1.5">
            <Label>¿Qué ves en el resumen?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={amountMode === "per_installment" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setAmountMode("per_installment")}
              >
                Monto por cuota
              </Button>
              <Button
                type="button"
                variant={amountMode === "total" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setAmountMode("total")}
              >
                Monto total
              </Button>
            </div>
          </div>

          {amountMode === "per_installment" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amountPerInst">
                Valor de cada cuota ($) — lo que ves en el resumen
              </Label>
              <Input
                id="amountPerInst"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountPerInstallment}
                onChange={(e) => {
                  const v = e.target.value
                  setAmountPerInstallment(v)
                  const n = parseFloat(v)
                  if (!isNaN(n) && installments > 0) {
                    setAmountTotal((n * installments).toFixed(2))
                  }
                  setErrors((p) => ({ ...p, amountPerInstallment: "" }))
                }}
                aria-invalid={!!errors.amountPerInstallment}
              />
              {errors.amountPerInstallment && (
                <p className="text-xs text-destructive">
                  {errors.amountPerInstallment}
                </p>
              )}
              {amountPerInstallment && installments > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total calculado: $
                  {(
                    parseFloat(amountPerInstallment) * installments
                  ).toFixed(2)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Monto total ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amountTotal}
                onChange={(e) => {
                  const v = e.target.value
                  setAmountTotal(v)
                  const n = parseFloat(v)
                  if (!isNaN(n) && installments > 0) {
                    setAmountPerInstallment((n / installments).toFixed(2))
                  }
                  setErrors((p) => ({ ...p, amountTotal: "" }))
                }}
                aria-invalid={!!errors.amountTotal}
              />
              {errors.amountTotal && (
                <p className="text-xs text-destructive">{errors.amountTotal}</p>
              )}
            </div>
          )}

          {/* Cuotas totales */}
          <div className="flex flex-col gap-1.5">
            <Label>Cuotas totales</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={installments <= 1}
                onClick={() =>
                  setInstallments((c) => Math.max(1, c - 1))
                }
              >
                <Minus className="size-3.5" />
              </Button>
              <span className="min-w-[2ch] text-center text-lg font-semibold tabular-nums">
                {installments}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={installments >= 48}
                onClick={() =>
                  setInstallments((c) => Math.min(48, c + 1))
                }
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Cuota inicial (para gastos ya en curso) */}
          {installments > 1 && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstInst">
                Cuota inicial — si ya pagaste algunas, ¿en cuál vas?
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={firstInstallment <= 1}
                  onClick={() =>
                    setFirstInstallment((c) => Math.max(1, c - 1))
                  }
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="min-w-[4ch] text-center tabular-nums">
                  {firstInstallment} de {installments}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={firstInstallment >= installments}
                  onClick={() =>
                    setFirstInstallment((c) =>
                      Math.min(installments, c + 1)
                    )
                  }
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              {errors.firstInstallment && (
                <p className="text-xs text-destructive">
                  {errors.firstInstallment}
                </p>
              )}
            </div>
          )}

          {/* Persona */}
          <div className="flex flex-col gap-1.5">
            <Label>Persona</Label>
            {persons.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                No hay personas. Creá al menos una en la pestaña Personas, o
                ejecutá el script SQL para cargar las por defecto.
              </p>
            )}
            <Select
              value={personId}
              onValueChange={(v) => {
                setPersonId(v)
                setErrors((p) => ({ ...p, personId: "" }))
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.personId}
              >
                <SelectValue placeholder="Seleccionar persona" />
              </SelectTrigger>
              <SelectContent>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.personId && (
              <p className="text-xs text-destructive">{errors.personId}</p>
            )}
          </div>

          {/* Fecha de compra */}
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de compra</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !purchaseDate && "text-muted-foreground"
                  )}
                  aria-invalid={!!errors.purchaseDate}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {purchaseDate
                    ? format(purchaseDate, "PPP", { locale: es })
                    : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={(d) => {
                    setPurchaseDate(d)
                    setErrors((p) => ({ ...p, purchaseDate: "" }))
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.purchaseDate && (
              <p className="text-xs text-destructive">{errors.purchaseDate}</p>
            )}
          </div>

          {/* Tarjeta (opcional) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="card">
              Tarjeta{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="card"
              placeholder="Ej: Visa Galicia"
              value={card}
              onChange={(e) => setCard(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">
              Notas{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEditing
                ? "Guardando..."
                : "Creando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
