import { DollarSign, Receipt, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatARS } from "@/lib/format"

interface SummaryCardsProps {
  total: number
  count: number
  byPerson: { person_id: number; person_name: string; total: number }[]
}

export function SummaryCards({ total, count, byPerson }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total del mes
          </CardTitle>
          <DollarSign className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">{formatARS(total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gastos activos
          </CardTitle>
          <Receipt className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tracking-tight">{count}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Por persona
          </CardTitle>
          <Users className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          {byPerson.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin gastos</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {byPerson.map((p) => (
                <div key={p.person_id} className="flex items-center justify-between">
                  <span className="text-sm">{p.person_name}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatARS(p.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
