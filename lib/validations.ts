import { z } from "zod"

export const personSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre es demasiado largo"),
})

export const expenseSchema = z
  .object({
    merchant: z
      .string()
      .min(1, "El comercio es obligatorio")
      .max(255, "El nombre del comercio es demasiado largo"),
    amount_total: z
      .number({ invalid_type_error: "Ingrese un monto" })
      .positive("El monto debe ser mayor a 0")
      .optional(),
    amount_per_installment: z
      .number({ invalid_type_error: "Ingrese el monto de la cuota" })
      .positive("El monto debe ser mayor a 0")
      .optional(),
    installments: z
      .number()
      .int()
      .min(1, "Minimo 1 cuota")
      .max(48, "Maximo 48 cuotas"),
    first_installment: z
      .number()
      .int()
      .min(1, "Minimo cuota 1")
      .max(48, "Maximo cuota 48")
      .optional()
      .default(1),
    person_id: z
      .number({ invalid_type_error: "Seleccione una persona" })
      .int()
      .positive("Seleccione una persona"),
    purchase_date: z.string().min(1, "La fecha es obligatoria"),
    card: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      const hasTotal = data.amount_total != null && data.amount_total > 0
      const hasPerInst =
        data.amount_per_installment != null && data.amount_per_installment > 0
      return hasTotal || hasPerInst
    },
    { message: "Ingrese monto total o monto por cuota", path: ["amount_total"] }
  )
  .refine(
    (data) =>
      !data.first_installment || data.first_installment <= data.installments,
    {
      message: "La cuota inicial no puede ser mayor al total de cuotas",
      path: ["first_installment"],
    }
  )
  .transform((data) => {
    const amount_total =
      data.amount_total ??
      (data.amount_per_installment != null
        ? Math.round(data.amount_per_installment * data.installments * 100) / 100
        : 0)
    return {
      ...data,
      amount_total,
      first_installment: data.first_installment ?? 1,
    }
  })

export type PersonInput = z.infer<typeof personSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
