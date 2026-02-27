const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatARS(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return arsFormatter.format(num)
}

export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function addMonths(yyyyMm: string, months: number): string {
  const [year, month] = yyyyMm.split("-").map(Number)
  const date = new Date(year, month - 1 + months)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}
