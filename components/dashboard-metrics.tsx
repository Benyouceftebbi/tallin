"use client"

import { ArrowDownIcon, ArrowUpIcon, Package, CreditCard, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function DashboardMetrics() {
  const metrics = [
    {
      title: "Total des commandes",
      value: "254",
      change: "+12%",
      trend: "up",
      description: "par rapport au mois dernier",
      icon: Package,
      color: "text-cyan-400",
      bgColor: "bg-cyan-950/30",
      borderColor: "border-cyan-700",
      gradientFrom: "from-cyan-500/20",
      gradientTo: "to-cyan-700/20",
    },
    {
      title: "Chiffre d'affaires",
      value: "€24,568",
      change: "+8%",
      trend: "up",
      description: "par rapport au mois dernier",
      icon: CreditCard,
      color: "text-purple-400",
      bgColor: "bg-purple-950/30",
      borderColor: "border-purple-700",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-purple-700/20",
    },
    {
      title: "Taux de livraison",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      description: "par rapport au mois dernier",
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/30",
      borderColor: "border-emerald-700",
      gradientFrom: "from-emerald-500/20",
      gradientTo: "to-emerald-700/20",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card
          key={metric.title}
          className={`border bg-gradient-to-br backdrop-blur-xl transition-all duration-300 hover:scale-105 ${metric.borderColor} ${metric.gradientFrom} ${metric.gradientTo}`}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-400">{metric.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-white">{metric.value}</p>
                  <div
                    className={`flex items-center text-xs font-medium ${
                      metric.trend === "up" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {metric.trend === "up" ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">{metric.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
