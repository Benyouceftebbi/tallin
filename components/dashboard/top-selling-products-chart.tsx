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
} from "@/components/ui/chart"

export function TopSellingProductsChart() {
  const { topSellingProducts } = useAppContext()

  // Ensure topSellingProducts is defined before mapping
  const safeTopSellingProducts = topSellingProducts || []

  // Transformer les données pour le graphique
  const data = safeTopSellingProducts.map((product) => ({
    name: product.name,
    sales: product.sales,
  }))

  return (
    <ChartContainer className="h-[300px]" data={data} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
      <ChartGrid strokeDasharray="3 3" vertical={false} />
      <ChartXAxis dataKey="name" tickLine={false} angle={-45} textAnchor="end" height={80} fontSize={12} />
      <ChartYAxis tickLine={false} axisLine={false} />
      <ChartTooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            return (
              <ChartTooltipContent>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{payload[0].payload.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#6366f1]" />
                    <p className="text-sm">Ventes: {payload[0].value}</p>
                  </div>
                </div>
              </ChartTooltipContent>
            )
          }
          return null
        }}
      />
      <ChartBar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
    </ChartContainer>
  )
}
