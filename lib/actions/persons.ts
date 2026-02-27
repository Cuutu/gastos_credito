"use server"

import { revalidatePath } from "next/cache"
import { getDb } from "@/lib/db"
import { personSchema } from "@/lib/validations"

export async function createPerson(formData: { name: string }) {
  const parsed = personSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] || "Datos invalidos" }
  }

  const sql = getDb()
  try {
    await sql`INSERT INTO persons (name) VALUES (${parsed.data.name})`
    revalidatePath("/")
    revalidatePath("/people")
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "Ya existe una persona con ese nombre" }
    }
    return { error: "Error al crear la persona" }
  }
}

export async function updatePerson(id: number, formData: { name: string }) {
  const parsed = personSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] || "Datos invalidos" }
  }

  const sql = getDb()
  try {
    await sql`UPDATE persons SET name = ${parsed.data.name} WHERE id = ${id}`
    revalidatePath("/")
    revalidatePath("/people")
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { error: "Ya existe una persona con ese nombre" }
    }
    return { error: "Error al actualizar la persona" }
  }
}

export async function deletePerson(id: number) {
  const sql = getDb()

  // Check if person has active expenses
  const expenses = await sql`
    SELECT COUNT(*) as count FROM expenses 
    WHERE person_id = ${id} AND deleted_at IS NULL
  `
  if (parseInt(expenses[0].count) > 0) {
    return {
      error: `Esta persona tiene ${expenses[0].count} gasto(s) activo(s). Elimine los gastos primero.`,
    }
  }

  try {
    await sql`DELETE FROM persons WHERE id = ${id}`
    revalidatePath("/")
    revalidatePath("/people")
    return { success: true }
  } catch {
    return { error: "Error al eliminar la persona" }
  }
}
