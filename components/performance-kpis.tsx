"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, CheckCircle, Truck, Package, RotateCcw, Copy, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import type { Order } from "@/lib/performance-data"

interface PerformanceKPIsProps {
  orders: Order[]
  isLoading: boolean
}
const confirmeStatuses = [
  'Confirmé',
  'En préparation',
  'Dispatcher',
  'En livraison',
  'Livrés',
  'Retour'
];
export function PerformanceKPIs({ orders, isLoading }: PerformanceKPIsProps) {
  // Calculate KPIs based on order status mapping
  const totalOrders = orders.length
  const recues = orders.length
const confirmees = orders.filter(o => confirmeStatuses.includes(o.confirmationStatus)).length;

  const enLivraison = orders.filter(o => ['En préparation',
  'Dispatcher',
  'En livraison',].includes(o.status)).length;
  const livrees = orders.filter(o => o.lastStatus === 'delivered' || o.status === 'Livrés').length
  const retournees = orders.filter(o => o.status ===  'Retour').length
  const enAttente = orders.filter(o => o.status === 'en-attente').length;

  const doublons = orders.filter(o => o.confirmationStatus ===  'Double').length
  const kpis = [
    {
      title: "Reçues",
      value: recues,
      percentage: totalOrders > 0 ? Math.round((recues / totalOrders) * 100) : 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      trend: "up"
    },
    {
      title: "En attente",
      value: enAttente,
      percentage: totalOrders > 0 ? Math.round((enAttente / totalOrders) * 100) : 0,
      icon: Clock, // choose an icon that makes sense
      color: "bg-yellow-500",
      trend: "stable"
    },
    {
      title: "Confirmées",
      value: confirmees,
      percentage: totalOrders > 0 ? Math.round((confirmees / totalOrders) * 100) : 0,
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "up"
    },
    {
      title: "En livraison",
      value: enLivraison,
      percentage: totalOrders > 0 ? Math.round((enLivraison / totalOrders) * 100) : 0,
      icon: Truck,
      color: "bg-orange-500",
      trend: "stable"
    },
    {
      title: "Livrées",
      value: livrees,
      percentage: totalOrders > 0 ? Math.round((livrees / totalOrders) * 100) : 0,
      icon: Package,
      color: "bg-emerald-500",
      trend: "up"
    },
    {
      title: "Retournées",
      value: retournees,
      percentage: totalOrders > 0 ? Math.round((retournees / totalOrders) * 100) : 0,
      icon: RotateCcw,
      color: "bg-red-500",
      trend: "down"
    },
    {
      title: "Doublons",
      value: doublons,
      percentage: totalOrders > 0 ? Math.round((doublons / totalOrders) * 100) : 0,
      icon: Copy,
      color: "bg-purple-500",
      trend: "down"
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : null
        
        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <div className={`p-2 rounded-full ${kpi.color}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value.toLocaleString()}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {kpi.percentage}%
                </Badge>
                {TrendIcon && (
                  <div className="flex items-center gap-1">
                    <TrendIcon className="h-3 w-3" />
                    <span>vs période précédente</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
