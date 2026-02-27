"use client"

import { Suspense, useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Header } from "@/components/header"
import { MonthPicker } from "@/components/month-picker"
import { SummaryCards } from "@/components/summary-cards"
import { InstallmentsTable } from "@/components/installments-table"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseDetail } from "@/components/expense-detail"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getCurrentMonth } from "@/lib/format"
import type {
  Person,
  InstallmentWithExpense,
  ExpenseWithPerson,
} from "@/lib/types"
import useSWR from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const monthParam = searchParams.get("month") || getCurrentMonth()
  const [month, setMonth] = useState(monthParam)
  const [personFilter, setPersonFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<ExpenseWithPerson | null>(null)
  const [detailExpenseId, setDetailExpenseId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query string
  const qp = new URLSearchParams({ month })
  if (personFilter && personFilter !== "all") qp.set("person_id", personFilter)
  if (debouncedSearch.trim()) qp.set("search", debouncedSearch.trim())

  const { data, mutate } = useSWR(`/api/dashboard?${qp.toString()}`, fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const persons: Person[] = data?.persons || []
  const installments: InstallmentWithExpense[] = data?.installments || []
  const total: number = data?.total || 0
  const count: number = data?.count || 0
  const byPerson = data?.byPerson || []

  const handleMonthChange = useCallback(
    (newMonth: string) => {
      setMonth(newMonth)
      const params = new URLSearchParams(searchParams.toString())
      params.set("month", newMonth)
      router.replace(`/?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Revalidate when form closes or after actions
  const handleMutate = useCallback(() => {
    mutate()
  }, [mutate])

  useEffect(() => {
    if (!formOpen) {
      handleMutate()
    }
  }, [formOpen, handleMutate])

  async function handleEdit(expenseId: number) {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`)
      const json = await res.json()
      if (json.expense) {
        setEditExpense(json.expense)
        setFormOpen(true)
      } else if (json.error) {
        toast.error(json.error)
      }
    } catch {
      toast.error("Error al cargar el gasto")
    }
  }

  function handleView(expenseId: number) {
    setDetailExpenseId(expenseId)
    setDetailOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Top bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <MonthPicker month={month} onChange={handleMonthChange} />
            <Button
              onClick={() => {
                setEditExpense(null)
                setFormOpen(true)
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Nuevo gasto
            </Button>
          </div>

          {/* Summary Cards */}
          <SummaryCards total={total} count={count} byPerson={byPerson} />

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por comercio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas las personas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las personas</SelectItem>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Installments Table */}
          <InstallmentsTable
            installments={installments}
            persons={persons}
            onEdit={handleEdit}
            onView={handleView}
            onMutate={handleMutate}
          />
        </div>
      </main>

      <ExpenseForm
        key={editExpense?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        persons={persons}
        expense={editExpense}
        onSuccess={(firstDueMonth) => {
          if (firstDueMonth) {
            setMonth(firstDueMonth)
            const params = new URLSearchParams(searchParams.toString())
            params.set("month", firstDueMonth)
            router.replace(`/?${params.toString()}`, { scroll: false })
          }
          handleMutate()
        }}
      />

      <ExpenseDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        expenseId={detailExpenseId}
      />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}
