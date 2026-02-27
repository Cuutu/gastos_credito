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
        e.merchant, e.person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
        p.name as person_name
      FROM expense_installments ei
      JOIN expenses e ON ei.expense_id = e.id
      JOIN persons p ON e.person_id = p.id
      WHERE ei.due_month = ${month}
        AND e.deleted_at IS NULL
        AND e.person_id = ${personId}
        AND LOWER(e.merchant) LIKE LOWER(${"%" + search + "%"})
      ORDER BY e.purchase_date DESC, e.merchant ASC
    `
    return rows as InstallmentWithExpense[]
  }

  if (personId) {
    const rows = await sql`
      SELECT 
        ei.id, ei.expense_id, ei.installment_number, ei.due_month, ei.amount, ei.created_at,
        e.merchant, e.person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
        p.name as person_name
      FROM expense_installments ei
      JOIN expenses e ON ei.expense_id = e.id
      JOIN persons p ON e.person_id = p.id
      WHERE ei.due_month = ${month}
        AND e.deleted_at IS NULL
        AND e.person_id = ${personId}
      ORDER BY e.purchase_date DESC, e.merchant ASC
    `
    return rows as InstallmentWithExpense[]
  }

  if (search) {
    const rows = await sql`
      SELECT 
        ei.id, ei.expense_id, ei.installment_number, ei.due_month, ei.amount, ei.created_at,
        e.merchant, e.person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
        p.name as person_name
      FROM expense_installments ei
      JOIN expenses e ON ei.expense_id = e.id
      JOIN persons p ON e.person_id = p.id
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
      e.merchant, e.person_id, e.installments as total_installments, e.amount_total, e.purchase_date,
      p.name as person_name
    FROM expense_installments ei
    JOIN expenses e ON ei.expense_id = e.id
    JOIN persons p ON e.person_id = p.id
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
    JOIN persons p ON e.person_id = p.id
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
): Promise<ExpenseWithPerson | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT e.*, p.name as person_name
    FROM expenses e
    JOIN persons p ON e.person_id = p.id
    WHERE e.id = ${id} AND e.deleted_at IS NULL
  `
  return (rows[0] as ExpenseWithPerson) || null
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
