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
  if (!yyyyMm || typeof yyyyMm !== "string") return "—"
  const [year, month] = yyyyMm.split("-")
  const y = parseInt(year, 10)
  const m = parseInt(month, 10)
  if (isNaN(y) || isNaN(m)) return yyyyMm
  const date = new Date(y, m - 1)
  if (isNaN(date.getTime())) return yyyyMm
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
}

export function formatDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "—"
  const date = new Date(dateStr + "T12:00:00")
  if (isNaN(date.getTime())) return dateStr
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
