"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ShoppingCart, CheckCircle, Truck, Package, RotateCcw, Copy, TrendingUp, TrendingDown, Clock, XCircle
} from 'lucide-react'
import type { Order } from "@/lib/performance-data"

interface PerformanceKPIsProps {
  orders: Order[]
  isLoading: boolean
}

const normalize = (v?: string) => (v ?? "").toString().trim().toLowerCase()

const EN_LIVRAISON_STATUSES = new Set(['en préparation', 'dispatcher', 'en livraison'])

export function PerformanceKPIs({ orders, isLoading }: PerformanceKPIsProps) {
  // KPIs base
  const totalOrders = orders.length
  const recues = totalOrders

  // Confirmation-layer counts
  const confirmees = orders.filter(o => new Set(["Confirmé Double","Confirmé"]).has(o.confirmationStatus)).length
  const enAttente = orders.filter(o => normalize(o.status) === 'en-attente').length
  const annulees = orders.filter(o =>
    ['annulé', 'annulée', 'annule'].includes(normalize(o.confirmationStatus)) ||
    ['annulé', 'annulée', 'annule'].includes(normalize(o.status))
  ).length
  const doublons = orders.filter(o => normalize(o.confirmationStatus) === 'double').length

  // Delivery-layer counts (overall)
  const enLivraison = orders.filter(o => EN_LIVRAISON_STATUSES.has(normalize(o.status))).length
  const livrees = orders.filter(o => normalize(o.lastStatus) === 'delivered' || normalize(o.status) === 'livrés').length
  const retournees = orders.filter(o => ['retour', 'retourné', 'retournée'].includes(normalize(o.status))).length

  // Delivery-layer counts **among confirmed**
  const confirmedOrders = orders.filter(o => new Set(["Confirmé Double","Confirmé"]).has(o.confirmationStatus))
  const confirmedTotal = confirmedOrders.length

  const enLivraisonAmongConfirmed = confirmedOrders.filter(o =>
    EN_LIVRAISON_STATUSES.has(normalize(o.status)) || normalize(o.lastStatus) === 'out-for-delivery'
  ).length

  const livreesAmongConfirmed = confirmedOrders.filter(o =>
    normalize(o.lastStatus) === 'delivered' || normalize(o.status) === 'livrés'
  ).length

  const retourneesAmongConfirmed = confirmedOrders.filter(o =>
    ['retour', 'retourné', 'retournée'].includes(normalize(o.status))
  ).length

  const kpis = [
    { title: "Reçues", value: recues, percentage: totalOrders > 0 ? Math.round((recues / totalOrders) * 100) : 0, icon: ShoppingCart, color: "bg-blue-500", trend: "up" as const },
    { title: "En attente", value: enAttente, percentage: totalOrders > 0 ? Math.round((enAttente / totalOrders) * 100) : 0, icon: Clock, color: "bg-yellow-500", trend: "stable" as const },
    { title: "Confirmées", value: confirmees, percentage: totalOrders > 0 ? Math.round((confirmees / totalOrders) * 100) : 0, icon: CheckCircle, color: "bg-green-500", trend: "up" as const },
    { title: "En livraison", value: enLivraison, percentage: totalOrders > 0 ? Math.round((enLivraison / totalOrders) * 100) : 0, icon: Truck, color: "bg-orange-500", trend: "stable" as const },
    { title: "Livrées", value: livrees, percentage: totalOrders > 0 ? Math.round((livrees / totalOrders) * 100) : 0, icon: Package, color: "bg-emerald-500", trend: "up" as const },
    { title: "Retournées", value: retournees, percentage: totalOrders > 0 ? Math.round((retournees / totalOrders) * 100) : 0, icon: RotateCcw, color: "bg-red-500", trend: "down" as const },
    { title: "Doublons", value: doublons, percentage: totalOrders > 0 ? Math.round((doublons / totalOrders) * 100) : 0, icon: Copy, color: "bg-purple-500", trend: "down" as const },
  ] as const

  // Cards for the tabs
  const confirmationCards = [
    { title: "Reçues", value: recues, pctBase: totalOrders, icon: ShoppingCart, color: "bg-blue-500", trend: "up" as const },
    { title: "Confirmées", value: confirmees, pctBase: totalOrders, icon: CheckCircle, color: "bg-green-500", trend: "up" as const },
    { title: "En attente", value: enAttente, pctBase: totalOrders, icon: Clock, color: "bg-yellow-500", trend: "stable" as const },
    { title: "Annulées", value: annulees, pctBase: totalOrders, icon: XCircle, color: "bg-rose-500", trend: "down" as const },
    { title: "Doublons", value: doublons, pctBase: totalOrders, icon: Copy, color: "bg-purple-500", trend: "down" as const },
  ] as const

  const livraisonAmongConfirmedCards = [
    { title: "En livraison", value: enLivraisonAmongConfirmed, pctBase: confirmedTotal, icon: Truck, color: "bg-orange-500", trend: "stable" as const },
    { title: "Livrées", value: livreesAmongConfirmed, pctBase: confirmedTotal, icon: Package, color: "bg-emerald-500", trend: "up" as const },
    { title: "Retournées", value: retourneesAmongConfirmed, pctBase: confirmedTotal, icon: RotateCcw, color: "bg-red-500", trend: "down" as const },
  ] as const

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
    <div className="space-y-6">
      {/* KPIs */}


      {/* Tabs with CARD grids */}
      <Tabs defaultValue="confirmation" className="w-full">
        <TabsList>
          <TabsTrigger value="confirmation">Statuts de confirmation</TabsTrigger>
          <TabsTrigger value="livraison">Statuts de livraison (parmi confirmées)</TabsTrigger>
        </TabsList>

        {/* Tab 1: Confirmation (Cards) */}
        <TabsContent value="confirmation" className="space-y-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {confirmationCards.map((c) => {
              const Icon = c.icon
              const TrendIcon = c.trend === 'up' ? TrendingUp : c.trend === 'down' ? TrendingDown : null
              const percentage = c.pctBase > 0 ? Math.round((c.value / c.pctBase) * 100) : 0

              return (
                <Card key={c.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                    <div className={`p-2 rounded-full ${c.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                      {TrendIcon && (
                        <div className="flex items-center gap-1">
                          <TrendIcon className="h-3 w-3" />
                          <span>sur le total</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Livraison among confirmed (Cards) */}
        <TabsContent value="livraison" className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Sur <span className="font-medium">{confirmedTotal.toLocaleString()}</span> confirmées
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {livraisonAmongConfirmedCards.map((c) => {
              const Icon = c.icon
              const TrendIcon = c.trend === 'up' ? TrendingUp : c.trend === 'down' ? TrendingDown : null
              const percentage = c.pctBase > 0 ? Math.round((c.value / c.pctBase) * 100) : 0

              return (
                <Card key={c.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                    <div className={`p-2 rounded-full ${c.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{c.value.toLocaleString()}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                      {TrendIcon && (
                        <div className="flex items-center gap-1">
                          <TrendIcon className="h-3 w-3" />
                          <span>sur confirmées</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
