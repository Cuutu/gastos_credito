export interface Person {
  id: number
  name: string
  created_at: string
}

export interface Expense {
  id: number
  merchant: string
  amount_total: string // numeric comes as string from PG
  installments: number
  person_id: number
  purchase_date: string
  card: string | null
  notes: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseInstallment {
  id: number
  expense_id: number
  installment_number: number
  due_month: string // YYYY-MM
  amount: string
  created_at: string
}

// Joined types for UI
export interface InstallmentWithExpense extends ExpenseInstallment {
  merchant: string
  person_name: string
  person_id: number
  total_installments: number
  amount_total: string
  purchase_date: string
}

export interface ExpenseWithPerson extends Expense {
  person_name: string
}

export interface MonthSummary {
  total: number
  count: number
  by_person: { person_id: number; person_name: string; total: number }[]
}
