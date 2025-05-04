"use client"

import { useAppContext } from "@/contexts/app-context"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLine,
  ChartXAxis,
  ChartYAxis,
  ChartGrid,
  ChartArea,
} from "@/components/ui/chart"

export function InventoryValueChart() {
  const { inventoryValue } = useAppContext()

  return (
    <ChartContainer className="h-[300px]" data={inventoryValue} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
      <ChartGrid strokeDasharray="3 3" />
      <ChartXAxis dataKey="month" tickLine={false} />
      <ChartYAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
      <ChartTooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            return (
              <ChartTooltipContent>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{payload[0].payload.month}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
                    <p className="text-sm">Valeur: ${payload[0].value.toLocaleString()}</p>
                  </div>
                </div>
              </ChartTooltipContent>
            )
          }
          return null
        }}
      />
      <ChartArea dataKey="value" fill="url(#colorValue)" fillOpacity={0.2} stroke="#0ea5e9" />
      <ChartLine type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} />
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </ChartContainer>
  )
}
