"use client"

import { useAppContext } from "@/contexts/app-context"
import {
  ChartContainer,
  ChartPie,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartCell,
} from "@/components/ui/chart"

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316"]

export function StockDistributionChart() {
  const { categoryDistribution } = useAppContext()

  // Ensure categoryDistribution is defined before mapping
  const safeCategoryDistribution = categoryDistribution || []

  return (
    <ChartContainer className="h-[300px]" data={safeCategoryDistribution}>
      <ChartPie
        data={safeCategoryDistribution}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={80}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        labelLine={false}
      >
        {safeCategoryDistribution.map((entry, index) => (
          <ChartCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </ChartPie>
      <ChartTooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            return (
              <ChartTooltipContent>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{payload[0].name}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
                    <p className="text-sm">
                      {payload[0].value}% ({payload[0].payload.value})
                    </p>
                  </div>
                </div>
              </ChartTooltipContent>
            )
          }
          return null
        }}
      />
      <ChartLegend
        layout="horizontal"
        verticalAlign="bottom"
        align="center"
        content={({ payload }) => {
          return (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
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
    </ChartContainer>
  )
}
