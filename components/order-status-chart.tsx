"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useShop } from "@/context/shop-context"
import { useMemo } from "react"

const chartConfig = {
  en_attente: {
    label: "En attente",
    color: "hsl(45, 93%, 47%)",
  },
  confirme: {
    label: "Confirmé",
    color: "hsl(142, 71%, 45%)",
  },
  en_livraison: {
    label: "En livraison",
    color: "hsl(217, 91%, 60%)",
  },
  livre: {
    label: "Livré",
    color: "hsl(158, 64%, 52%)",
  },
  retour: {
    label: "Retour",
    color: "hsl(0, 84%, 60%)",
  },
}

interface OrderStatusChartProps {
  type?: "area" | "pie"
}

export function OrderStatusChart({ type = "area" }: OrderStatusChartProps) {
  const { orders, loading, getOrdersByStatus } = useShop()

  const pieData = useMemo(() => {
    if (loading) return []

    return [
 { name: "En attente", value: getOrdersByStatus("en-attente").length, color: "#eab308" },
      { name: "Confirmé", value: getOrdersByStatus("Confirmé").length, color: "#22c55e" },
      { name: "En livraison", value: getOrdersByStatus("En livraison").length, color: "#3b82f6" },
      { name: "Livré", value: getOrdersByStatus("Livrés").length, color: "#10b981" },
      { name: "Retour", value: getOrdersByStatus("Retour").length, color: "#ef4444" },
    ]
  }, [orders, loading, getOrdersByStatus])

  const areaData = useMemo(() => {
    if (loading) return []

    // Generate last 7 days data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayOrders = orders.filter((order) => order.date === date)
      const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
      const dayName = dayNames[new Date(date).getDay()]

      return {
      date: dayName,
        en_attente: dayOrders.filter((o) => o.status === "en-attente").length,
        confirme: dayOrders.filter((o) => o.status === "Confirmé").length,
        en_livraison: dayOrders.filter((o) => o.status === "En livraison").length,
        livre: dayOrders.filter((o) => o.status === "Livrés").length,
        retour: dayOrders.filter((o) => o.status === "Retour").length,
      }
    })
  }, [orders, loading])

  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (type === "pie") {
    return (
      <div className="space-y-4">
        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [`${value} commandes`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {pieData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name}</span>
              <span className="text-slate-400 ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEnAttente" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-en_attente)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-en_attente)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorConfirme" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-confirme)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-confirme)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorEnLivraison" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-en_livraison)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-en_livraison)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorLivre" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-livre)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-livre)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorRetour" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-retour)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-retour)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            className="text-slate-400"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            className="text-slate-400"
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            labelFormatter={(label) => `${label}`}
            formatter={(value, name) => [
              `${value} commandes`,
              chartConfig[name as keyof typeof chartConfig]?.label || name,
            ]}
          />
          <Area type="monotone" dataKey="retour" stackId="1" stroke="var(--color-retour)" fill="url(#colorRetour)" />
          <Area
            type="monotone"
            dataKey="en_livraison"
            stackId="1"
            stroke="var(--color-en_livraison)"
            fill="url(#colorEnLivraison)"
          />
          <Area type="monotone" dataKey="livre" stackId="1" stroke="var(--color-livre)" fill="url(#colorLivre)" />
          <Area
            type="monotone"
            dataKey="confirme"
            stackId="1"
            stroke="var(--color-confirme)"
            fill="url(#colorConfirme)"
          />
          <Area
            type="monotone"
            dataKey="en_attente"
            stackId="1"
            stroke="var(--color-en_attente)"
            fill="url(#colorEnAttente)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
