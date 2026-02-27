"use server"

import { revalidatePath } from "next/cache"
import { getDb } from "@/lib/db"
import { expenseSchema } from "@/lib/validations"
import type { ExpenseInput } from "@/lib/validations"

function computeInstallments(
  total: number,
  count: number,
  purchaseDate: string,
  firstInstallment: number = 1
): { installmentNumber: number; dueMonth: string; amount: number }[] {
  const [year, month] = purchaseDate.split("-").map(Number)
  const baseAmount = Math.floor((total / count) * 100) / 100
  const remainder = Math.round((total - baseAmount * count) * 100) / 100

  const result: {
    installmentNumber: number
    dueMonth: string
    amount: number
  }[] = []

  // firstInstallment: cuota desde la cual empezar (ej: 3 = cuota 3 de 12)
  // El mes de vencimiento de la cuota N es purchaseDate + (N-1) meses
  for (let i = firstInstallment - 1; i < count; i++) {
    const installmentNumber = i + 1
    const d = new Date(year, month - 1 + i)
    const dueMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const amount = i === count - 1 ? baseAmount + remainder : baseAmount

    result.push({
      installmentNumber,
      dueMonth,
      amount: Math.round(amount * 100) / 100,
    })
  }

  return result
}

export async function createExpense(formData: ExpenseInput) {
  const parsed = expenseSchema.safeParse(formData)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(errors).flat()[0]
    return { error: firstError || "Datos invalidos" }
  }

  const data = parsed.data
  const sql = getDb()

  try {
    // Insert expense
    const rows = await sql`
      INSERT INTO expenses (merchant, amount_total, installments, person_id, purchase_date, card, notes)
      VALUES (${data.merchant}, ${data.amount_total}, ${data.installments}, ${data.person_id}, ${data.purchase_date}, ${data.card || null}, ${data.notes || null})
      RETURNING id
    `
    const expenseId = rows[0].id as number

    // Generate installments
    const installments = computeInstallments(
      data.amount_total,
      data.installments,
      data.purchase_date,
      data.first_installment
    )

    for (const inst of installments) {
      await sql`
        INSERT INTO expense_installments (expense_id, installment_number, due_month, amount)
        VALUES (${expenseId}, ${inst.installmentNumber}, ${inst.dueMonth}, ${inst.amount})
      `
    }

    revalidatePath("/")
    revalidatePath("/expenses")
    return { success: true, id: expenseId }
  } catch (e) {
    console.error("Error creating expense:", e)
    return { error: "Error al crear el gasto" }
  }
}

export async function updateExpense(id: number, formData: ExpenseInput) {
  const parsed = expenseSchema.safeParse(formData)
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    const firstError = Object.values(errors).flat()[0]
    return { error: firstError || "Datos invalidos" }
  }

  const data = parsed.data
  const sql = getDb()

  try {
    // Update expense
    await sql`
      UPDATE expenses 
      SET merchant = ${data.merchant}, 
          amount_total = ${data.amount_total}, 
          installments = ${data.installments}, 
          person_id = ${data.person_id}, 
          purchase_date = ${data.purchase_date}, 
          card = ${data.card || null}, 
          notes = ${data.notes || null},
          updated_at = NOW()
      WHERE id = ${id}
    `

    // Regenerate installments
    await sql`DELETE FROM expense_installments WHERE expense_id = ${id}`

    const installments = computeInstallments(
      data.amount_total,
      data.installments,
      data.purchase_date,
      data.first_installment
    )

    for (const inst of installments) {
      await sql`
        INSERT INTO expense_installments (expense_id, installment_number, due_month, amount)
        VALUES (${id}, ${inst.installmentNumber}, ${inst.dueMonth}, ${inst.amount})
      `
    }

    revalidatePath("/")
    revalidatePath("/expenses")
    return { success: true }
  } catch (e) {
    console.error("Error updating expense:", e)
    return { error: "Error al actualizar el gasto" }
  }
}

export async function deleteExpense(id: number) {
  const sql = getDb()

  try {
    // Soft delete the expense
    await sql`UPDATE expenses SET deleted_at = NOW() WHERE id = ${id}`
    // Also delete the installments for clean queries
    await sql`DELETE FROM expense_installments WHERE expense_id = ${id}`

    revalidatePath("/")
    revalidatePath("/expenses")
    return { success: true }
  } catch {
    return { error: "Error al eliminar el gasto" }
  }
}
