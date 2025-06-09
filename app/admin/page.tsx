"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DatePickerWithRange } from "@/components/date-picker-range"
import { OrderStatusMetrics } from "@/components/order-status-metrics"
import { OrderStatusChart } from "@/components/order-status-chart"
import { ConfirmatricePerformance } from "@/components/confirmatrice-performance"
import { ArticlePerformance } from "@/components/article-performance"

import { Topbar } from "@/components/topbar"
import { Filter, TrendingUp, AlertCircle } from "lucide-react"
import { addDays } from "date-fns"
import { useShop } from "@/context/shop-context"
import { useAppContext } from "@/context/app-context"

export default function Dashboard() {
  const { workers, loading, error, getConfirmationRate, getTodayRevenue, filters, setFilters } = useShop()
const {products}=useAppContext()
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  })

  const articles = [
    { id: "all", name: "Tous les articles" },
    { id: "phone", name: "Téléphones" },
    { id: "laptop", name: "Ordinateurs portables" },
    { id: "watch", name: "Montres" },
    { id: "headphones", name: "Écouteurs" },
  ]

  // Update filters when local state changes
  useEffect(() => {
    setFilters({
      ...filters,
      dateRange: filters.dateFilter === "custom" ? dateRange : undefined,
    })
  }, [dateRange]) // Removed filters.dateFilter from dependency array

  const handleDateFilterChange = (value: string) => {
    setFilters({
      ...filters,
      dateFilter: value,
      dateRange: value === "custom" ? dateRange : undefined,
    })
  }

  const handleConfirmatriceChange = (value: string) => {
    setFilters({
      ...filters,
      confirmatrice: value,
    })
  }

  const handleArticleChange = (value: string) => {
    setFilters({
      ...filters,
      article: value,
    })
  }

  if (error) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-red-800 bg-red-900/50 backdrop-blur-xl">
            <CardContent className="flex items-center gap-4 p-6">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-100">Erreur de connexion</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Tableau de bord - Performance Confirmatrices
            </h1>
            <p className="text-slate-400 mt-2">Suivi en temps réel des commandes et performance des équipes</p>
          </div>
          <div className="text-sm text-slate-400">
            Dernière mise à jour: <span className="text-white">Aujourd'hui, 14:32</span>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Période</label>
                <Select value={filters.dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="yesterday">Hier</SelectItem>
                    <SelectItem value="lastweek">7 derniers jours</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filters.dateFilter === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Intervalle de dates</label>
                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirmatrice</label>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={filters.confirmatrice} onValueChange={handleConfirmatriceChange}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les confirmatrices</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker.name} value={worker.name}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

                <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Article</label>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={filters.article} onValueChange={handleArticleChange}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les articles</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Metrics */}
        <OrderStatusMetrics />

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Taux de confirmation</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-white">{getConfirmationRate(true).toFixed(1)}%</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Revenus (période filtrée)</p>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold text-white">{getTodayRevenue(true).toLocaleString()} DZD</p>
                  )}
                </div>
                <div className="h-12 w-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-cyan-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Temps moyen de traitement</p>
                  <p className="text-2xl font-bold text-white">2.4h</p>
                </div>
                <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution des statuts
              </CardTitle>
              <CardDescription>Tendance des commandes par statut (données filtrées)</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusChart />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Distribution des statuts</CardTitle>
              <CardDescription>Répartition actuelle des commandes (données filtrées)</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusChart type="pie" />
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ConfirmatricePerformance />
          <ArticlePerformance />
        </div>

        {/* Orders Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-100">Commandes détaillées</CardTitle>
            <CardDescription>Liste complète des commandes avec filtres appliqués</CardDescription>
          </CardHeader>
          <CardContent>
    
          </CardContent>
        </Card>
      </div>
    </>
  )
}
