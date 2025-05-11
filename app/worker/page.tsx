import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ParcelTable } from "@/components/parcel-table"
import { DashboardChart } from "@/components/dashboard-chart"
import { DashboardMetrics } from "@/components/dashboard-metrics"
import { Topbar } from "@/components/topbar"

export default function Dashboard() {
  return (
    <>
      <Topbar />
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <div className="text-sm text-slate-400">
            Dernière mise à jour: <span className="text-white">Aujourd'hui, 14:32</span>
          </div>
        </div>

        <DashboardMetrics />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100">Commandes par jour</CardTitle>
              <CardDescription>7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardChart type="orders" />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100">Revenus</CardTitle>
              <CardDescription>7 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardChart type="revenue" />
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-100">Performance de livraison</CardTitle>
              <CardDescription>Taux de livraison réussie</CardDescription>
            </CardHeader>
            <CardContent>
              <DashboardChart type="delivery" />
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-slate-100">Commandes récentes</CardTitle>
            <CardDescription>Liste des dernières commandes reçues</CardDescription>
          </CardHeader>
          <CardContent>
            <ParcelTable status="recent" />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
