"use client"

import { useAppContext } from "@/contexts/app-context"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartBar,
  ChartXAxis,
  ChartYAxis,
  ChartGrid,
  ChartLegend,
} from "@/components/ui/chart"

export function InventoryOverview() {
  const { movements } = useAppContext()

  // Ensure movements is defined before processing
  const safeMovements = movements || []

  // Transformer les mouvements en données pour le graphique
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  }).reverse()

  const data = last14Days.map((date) => {
    const dayMovements = safeMovements.filter((m) => m.date === date)
    const inflow = dayMovements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0)
    const outflow = dayMovements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0)

    // Formater la date pour l'affichage (MM/DD)
    const [year, month, day] = date.split("-")
    const formattedDate = `${month}/${day}`

    return {
      date: formattedDate,
      inflow,
      outflow,
    }
  })

  return (
    <ChartContainer className="h-[350px]" data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <ChartGrid strokeDasharray="3 3" />
      <ChartXAxis dataKey="date" />
      <ChartYAxis />
      <ChartTooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            return (
              <ChartTooltipContent>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{payload[0].payload.date}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
                    <p className="text-sm">Stock In: {payload[0].value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#ef4444]" />
                    <p className="text-sm">Stock Out: {payload[1].value}</p>
                  </div>
                </div>
              </ChartTooltipContent>
            )
          }
          return null
        }}
      />
      <ChartLegend
        content={({ payload }) => {
          return (
            <div className="flex items-center justify-center gap-4 text-sm">
              {payload?.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.value}</span>
                </div>
              ))}
            </div>
          )
        }}
      />
      <ChartBar dataKey="inflow" name="Stock In" fill="#22c55e" radius={[4, 4, 0, 0]} />
      <ChartBar dataKey="outflow" name="Stock Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
    </ChartContainer>
  )
}
