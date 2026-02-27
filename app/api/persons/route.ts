import { NextResponse } from "next/server"
import { getPersons } from "@/lib/queries"

export async function GET() {
  const persons = await getPersons()
  return NextResponse.json(persons)
}
