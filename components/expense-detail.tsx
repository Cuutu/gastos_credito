"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatARS, formatDate, formatMonth } from "@/lib/format"
import type { ExpenseWithPerson } from "@/lib/types"

interface ExpenseDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseId: number | null
}

export function ExpenseDetail({
  open,
  onOpenChange,
  expenseId,
}: ExpenseDetailProps) {
  const [expense, setExpense] = useState<ExpenseWithPerson | null>(null)
  const [installments, setInstallments] = useState<
    { installment_number: number; due_month: string; amount: number }[]
  >([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && expenseId) {
      setLoading(true)
      fetch(`/api/expenses/${expenseId}`)
        .then((r) => r.json())
        .then((data) => {
          setExpense(data.expense)
          // Agrupar por cuota (gastos compartidos tienen varias filas por cuota)
          const byInst = new Map<string, { installment_number: number; due_month: string; amount: number }>()
          for (const i of data.installments || []) {
            const key = `${i.installment_number}-${i.due_month}`
            const prev = byInst.get(key)
            const amt = parseFloat(i.amount)
            byInst.set(key, {
              installment_number: i.installment_number,
              due_month: i.due_month,
              amount: prev ? prev.amount + amt : amt,
            })
          }
          setInstallments(
            Array.from(byInst.values()).sort((a, b) => a.installment_number - b.installment_number)
          )
        })
        .finally(() => setLoading(false))
    } else {
      setExpense(null)
      setInstallments([])
    }
  }, [open, expenseId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle del gasto</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col gap-3 py-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-4 h-32 w-full" />
          </div>
        ) : expense ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Comercio</p>
                <p className="font-medium">{expense.merchant}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {(expense as ExpenseWithPerson & { person_ids?: number[]; person_names?: string[] })
                    .person_ids?.length > 1
                    ? "Personas (compartido)"
                    : "Persona"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(
                    expense as ExpenseWithPerson & {
                      person_ids?: number[]
                      person_names?: string[]
                    }
                  ).person_names?.map((name, i) => (
                    <Badge key={i} variant="secondary">
                      {name}
                    </Badge>
                  )) ?? (
                    <Badge variant="secondary">{expense.person_name}</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monto total</p>
                <p className="text-lg font-bold">
                  {formatARS(expense.amount_total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cuotas</p>
                <p className="font-medium">{expense.installments}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha compra</p>
                <p className="text-sm">{formatDate(expense.purchase_date)}</p>
              </div>
              {expense.card && (
                <div>
                  <p className="text-xs text-muted-foreground">Tarjeta</p>
                  <p className="text-sm">{expense.card}</p>
                </div>
              )}
            </div>

            {expense.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm">{expense.notes}</p>
              </div>
            )}

            {installments.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Plan de cuotas</p>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installments.map((inst) => (
                        <TableRow
                          key={`${inst.installment_number}-${inst.due_month}`}
                        >
                          <TableCell className="tabular-nums">
                            {inst.installment_number}
                          </TableCell>
                          <TableCell className="capitalize">
                            {formatMonth(inst.due_month)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatARS(inst.amount.toString())}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
