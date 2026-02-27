import { NextResponse } from "next/server"
import { getExpenseById, getExpenseInstallments } from "@/lib/queries"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const expenseId = parseInt(id)

  if (isNaN(expenseId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const [expense, installments] = await Promise.all([
    getExpenseById(expenseId),
    getExpenseInstallments(expenseId),
  ])

  if (!expense) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const first_installment =
    installments.length > 0
      ? Math.min(...installments.map((i) => i.installment_number))
      : 1

  return NextResponse.json({
    expense: { ...expense, first_installment },
    installments,
  })
}
