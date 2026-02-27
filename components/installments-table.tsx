"use client"

import { useState, useTransition } from "react"
import { Eye, Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { formatARS, formatDate } from "@/lib/format"
import { deleteExpense } from "@/lib/actions/expenses"
import type { InstallmentWithExpense } from "@/lib/types"
import type { Person } from "@/lib/types"
import { toast } from "sonner"
import { Receipt } from "lucide-react"

interface InstallmentsTableProps {
  installments: InstallmentWithExpense[]
  persons: Person[]
  onEdit: (expenseId: number) => void
  onView: (expenseId: number) => void
  onMutate?: () => void
}

export function InstallmentsTable({
  installments,
  onEdit,
  onView,
  onMutate,
}: InstallmentsTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!deleteId) return
    startTransition(async () => {
      const result = await deleteExpense(deleteId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Gasto eliminado")
        onMutate?.()
      }
      setDeleteId(null)
    })
  }

  if (installments.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyTitle>No hay cuotas este mes</EmptyTitle>
          <EmptyDescription>
            Agrega un gasto usando el boton de arriba para verlo reflejado
            aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comercio</TableHead>
              <TableHead className="hidden sm:table-cell">Persona</TableHead>
              <TableHead className="text-center">Cuota</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="hidden md:table-cell">
                Fecha compra
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{inst.merchant}</span>
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {inst.person_name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary">{inst.person_name}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="tabular-nums text-sm">
                    {inst.installment_number}/{inst.total_installments}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatARS(inst.amount)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(inst.purchase_date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onView(inst.expense_id)}
                      aria-label="Ver detalle"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onEdit(inst.expense_id)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(inst.expense_id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara el gasto y todas sus cuotas. No se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
