import { NextResponse } from "next/server"
import {
  getPersons,
  getInstallmentsByMonth,
  getMonthTotal,
  getMonthCountExpenses,
  getTotalsByPerson,
} from "@/lib/queries"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") || ""
  const personIdStr = searchParams.get("person_id")
  const search = searchParams.get("search") || undefined

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 })
  }

  const personId = personIdStr ? parseInt(personIdStr) : undefined

  const [persons, installments, total, count, byPerson] = await Promise.all([
    getPersons(),
    getInstallmentsByMonth(month, personId, search),
    getMonthTotal(month),
    getMonthCountExpenses(month),
    getTotalsByPerson(month),
  ])

  return NextResponse.json({ persons, installments, total, count, byPerson })
}
