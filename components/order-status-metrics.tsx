"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, CheckCircle, Truck, Package, RotateCcw, TrendingUp, TrendingDown, CalendarClock, AlertTriangle, XCircle, Copy } from "lucide-react"
import { useShop } from "@/context/shop-context"

const statusConfig = {
  "Confirmé": {
    label: "Confirmée",
    icon: CheckCircle,
    color: "bg-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  "Annulé": {
    label: "Annulée",
    icon: XCircle, // You can replace this with any appropriate icon
    color: "bg-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  "Échouées": {
    label: "Échouée",
    icon: AlertTriangle, // You can replace this with any appropriate icon
    color: "bg-red-600",
    bgColor: "bg-red-600/10",
    borderColor: "border-red-600/20",
  },
  "En attente": {
    label: "En attente",
    icon: Clock,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  "Reporté": {
    label: "Reportée",
    icon: CalendarClock, // You can replace this with any appropriate icon
    color: "bg-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  "Double": {
    label: "Dupliquée",
    icon: Copy, // You can replace this with any appropriate icon
    color: "bg-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
}

export function OrderStatusMetrics() {
  const { orders, loading, getTotalOrders, getOrdersByStatuss } = useShop()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalOrders = getTotalOrders()

  const statusData = Object.entries(statusConfig).map(([status, config]) => {
    const count = getOrdersByStatuss(status).length
    const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0

    return {
      status: config.label,
      count,
      percentage: Number.parseFloat(percentage.toFixed(1)),
      trend: "up", // You can calculate actual trends based on historical data
      trendValue: Math.floor(Math.random() * 20), // Mock trend for now
      ...config,
    }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {/* Total Orders Card */}
      <Card className="border-slate-800 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-xl border-cyan-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-100">Total Commandes</CardTitle>
          <Package className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalOrders}</div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">Toutes périodes</p>
            <Badge className="bg-cyan-500/20 text-cyan-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              Actif
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Status cards */}
      {statusData.map((item) => {
        const Icon = item.icon
        const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={item.status} className={`border-slate-800 ${item.bgColor} backdrop-blur-xl ${item.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-100">{item.status}</CardTitle>
              <Icon className={`h-4 w-4 ${item.color.replace("bg-", "text-")}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{item.count}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">{item.percentage}% du total</p>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    item.trend === "up" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {item.trendValue}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
