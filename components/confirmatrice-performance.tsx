"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Award, Target } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { useMemo } from "react"

const chartConfig = {
  confirmed: {
    label: "Confirmées",
    color: "hsl(142, 71%, 45%)",
  },
  pending: {
    label: "En attente",
    color: "hsl(45, 93%, 47%)",
  },
}

export function ConfirmatricePerformance() {
  const { workers, filteredOrders, loading } = useShop()

  const performanceData = useMemo(() => {
    if (loading) return []

    return workers
      .map((worker) => {
        const workerOrders = filteredOrders.filter((order) => order.confirmatrice === worker.name)
        const confirmed = workerOrders.filter(
      (order) => order.status === "Confirmé" || order.status === "En livraison" || order.status === "Livrés",
        ).length
        const pending = workerOrders.filter((order) => order.status === "en-attente").length
        const total = workerOrders.length
        const success_rate = total > 0 ? (confirmed / total) * 100 : 0

        return {
          name: worker.name
            .split(" ")
            .map((n) => n.charAt(0).toUpperCase() + n.slice(1, 3))
            .join(" "),
          fullName: worker.name,
          confirmed,
          pending,
          success_rate: Number.parseFloat(success_rate.toFixed(1)),
        }
      })
      .filter((worker) => worker.confirmed > 0 || worker.pending > 0)
  }, [workers, filteredOrders, loading])

  const topPerformer = useMemo(() => {
    if (performanceData.length === 0) return null
    return performanceData.reduce((prev, current) => (prev.success_rate > current.success_rate ? prev : current))
  }, [performanceData])

  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance des Confirmatrices
          </CardTitle>
          <CardDescription>Comparaison des performances individuelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-[250px] w-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Performance des Confirmatrices
        </CardTitle>
        <CardDescription>Comparaison des performances individuelles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Performer Badge */}
        {topPerformer && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-slate-100">Meilleure performance</p>
                <p className="text-xs text-slate-400">{topPerformer.fullName}</p>
              </div>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400">{topPerformer.success_rate}% de réussite</Badge>
          </div>
        )}

        {/* Chart */}
        {performanceData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="confirmedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-confirmed)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-confirmed)" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    `${value} commandes`,
                    name === "confirmed" ? "Confirmées" : "En attente",
                  ]}
                  labelFormatter={(label) => {
                    const worker = performanceData.find((w) => w.name === label)
                    return worker?.fullName || label
                  }}
                />
                <Bar dataKey="confirmed" fill="url(#confirmedGradient)" radius={[4, 4, 0, 0]} name="confirmed" />
                <Bar dataKey="pending" fill="url(#pendingGradient)" radius={[4, 4, 0, 0]} name="pending" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-400">
            Aucune donnée de performance disponible
          </div>
        )}

        {/* Performance Details */}
        <div className="space-y-3">
          {performanceData.map((person, index) => (
            <div key={person.fullName} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {person.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-100">{person.fullName}</p>
                  <p className="text-xs text-slate-400">
                    {person.confirmed} confirmées • {person.pending} en attente
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-100">{person.success_rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
