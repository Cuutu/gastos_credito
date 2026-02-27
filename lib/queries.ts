import { getDb } from "@/lib/db"
import type {
  Person,
  ExpenseWithPerson,
  InstallmentWithExpense,
  ExpenseInstallment,
} from "@/lib/types"

export async function getPersons(): Promise<Person[]> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM persons ORDER BY name ASC`
  return rows as Person[]
}

export async function getPersonById(id: number): Promise<Person | null> {
  const sql = getDb()
  const rows = await sql`SELECT * FROM persons WHERE id = ${id}`
  return (rows[0] as Person) || null
}

export async function getInstallmentsByMonth(
  month: string,
  personId?: number,
  search?: string
): Promise<InstallmentWithExpense[]> {
  const sql = getDb()

  if (personId && search) {
    const rows = await sql`
      SELECT 
        ei.id, ei.expense_id, ei.installment_number, ei.due_month, ei.amount, ei.created_at,
        e.merchant, COALESCE(ei.person_id, e.person_id) as person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
        p.name as person_name
      FROM expense_installments ei
      JOIN expenses e ON ei.expense_id = e.id
      JOIN persons p ON COALESCE(ei.person_id, e.person_id) = p.id
      WHERE ei.due_month = ${month}
        AND e.deleted_at IS NULL
        AND COALESCE(ei.person_id, e.person_id) = ${personId}
        AND LOWER(e.merchant) LIKE LOWER(${"%" + search + "%"})
      ORDER BY e.purchase_date DESC, e.merchant ASC
    `
    return rows as InstallmentWithExpense[]
  }

  if (personId) {
    const rows = await sql`
      SELECT 
        ei.id, ei.expense_id, ei.installment_number, ei.due_month, ei.amount, ei.created_at,
        e.merchant, COALESCE(ei.person_id, e.person_id) as person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
        p.name as person_name
      FROM expense_installments ei
      JOIN expenses e ON ei.expense_id = e.id
      JOIN persons p ON COALESCE(ei.person_id, e.person_id) = p.id
      WHERE ei.due_month = ${month}
        AND e.deleted_at IS NULL
        AND COALESCE(ei.person_id, e.person_id) = ${personId}
      ORDER BY e.purchase_date DESC, e.merchant ASC
    `
    return rows as InstallmentWithExpense[]
  }

  if (search) {
    const rows = await sql`
      SELECT 
        ei.id, ei.expense_id, ei.installment_number, ei.due_month, ei.amount, ei.created_at,
        e.merchant, COALESCE(ei.person_id, e.person_id) as person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
        p.name as person_name
      FROM expense_installments ei
      JOIN expenses e ON ei.expense_id = e.id
      JOIN persons p ON COALESCE(ei.person_id, e.person_id) = p.id
      WHERE ei.due_month = ${month}
        AND e.deleted_at IS NULL
        AND LOWER(e.merchant) LIKE LOWER(${"%" + search + "%"})
      ORDER BY e.purchase_date DESC, e.merchant ASC
    `
    return rows as InstallmentWithExpense[]
  }

  const rows = await sql`
    SELECT 
      ei.id, ei.expense_id, ei.installment_number, ei.due_month, ei.amount, ei.created_at,
      e.merchant, COALESCE(ei.person_id, e.person_id) as person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
      p.name as person_name
    FROM expense_installments ei
    JOIN expenses e ON ei.expense_id = e.id
    JOIN persons p ON COALESCE(ei.person_id, e.person_id) = p.id
    WHERE ei.due_month = ${month}
      AND e.deleted_at IS NULL
    ORDER BY e.purchase_date DESC, e.merchant ASC
  `
  return rows as InstallmentWithExpense[]
}

export async function getMonthTotal(month: string): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    SELECT COALESCE(SUM(ei.amount), 0) as total
    FROM expense_installments ei
    JOIN expenses e ON ei.expense_id = e.id
    WHERE ei.due_month = ${month} AND e.deleted_at IS NULL
  `
  return parseFloat(rows[0].total)
}

export async function getMonthCountExpenses(month: string): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    SELECT COUNT(DISTINCT ei.expense_id) as count
    FROM expense_installments ei
    JOIN expenses e ON ei.expense_id = e.id
    WHERE ei.due_month = ${month} AND e.deleted_at IS NULL
  `
  return parseInt(rows[0].count)
}

export async function getTotalsByPerson(
  month: string
): Promise<{ person_id: number; person_name: string; total: number }[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT p.id as person_id, p.name as person_name, COALESCE(SUM(ei.amount), 0) as total
    FROM expense_installments ei
    JOIN expenses e ON ei.expense_id = e.id
    JOIN persons p ON COALESCE(ei.person_id, e.person_id) = p.id
    WHERE ei.due_month = ${month} AND e.deleted_at IS NULL
    GROUP BY p.id, p.name
    ORDER BY total DESC
  `
  return rows.map((r) => ({
    person_id: r.person_id as number,
    person_name: r.person_name as string,
    total: parseFloat(r.total as string),
  }))
}

export async function getExpenseById(
  id: number
): Promise<(ExpenseWithPerson & { person_ids?: number[] }) | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT e.*, p.name as person_name
    FROM expenses e
    JOIN persons p ON e.person_id = p.id
    WHERE e.id = ${id} AND e.deleted_at IS NULL
  `
  const expense = (rows[0] as ExpenseWithPerson) || null
  if (!expense) return null

  const shared = await sql`
    SELECT ep.person_id, p.name as person_name
    FROM expense_persons ep
    JOIN persons p ON ep.person_id = p.id
    WHERE ep.expense_id = ${id}
    ORDER BY ep.person_id
  `
  if (shared.length > 0) {
    return {
      ...expense,
      person_ids: shared.map((r) => r.person_id as number),
      person_names: shared.map((r) => r.person_name as string),
    }
  }
  return {
    ...expense,
    person_ids: [expense.person_id],
    person_names: [expense.person_name],
  }
}

export async function getExpenseInstallments(
  expenseId: number
): Promise<ExpenseInstallment[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM expense_installments 
    WHERE expense_id = ${expenseId}
    ORDER BY installment_number ASC
  `
  return rows as ExpenseInstallment[]
}

export async function getPersonExpenseCount(personId: number): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    SELECT COUNT(*) as count FROM expenses 
    WHERE person_id = ${personId} AND deleted_at IS NULL
  `
  return parseInt(rows[0].count)
}
