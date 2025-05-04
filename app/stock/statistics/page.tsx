import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Share2 } from "lucide-react"
import { ProductPerformanceStats } from "@/components/statistics/product-performance-stats"
import { SalesPerformanceStats } from "@/components/statistics/sales-performance-stats"
import { DeliveryPerformanceStats } from "@/components/statistics/delivery-performance-stats"
import { InventoryPerformanceStats } from "@/components/statistics/inventory-performance-stats"
import { StatisticsFilters } from "@/components/statistics/statistics-filters"

export default function StatisticsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Statistiques & Analyses</h2>
          <p className="text-muted-foreground">
            Aperçu complet de vos performances d'inventaire, de ventes et de livraison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter les données
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Partager le rapport
          </Button>
        </div>
      </div>

      <StatisticsFilters />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 231,89 €</div>
            <p className="text-xs text-muted-foreground">+20,1% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produit le plus vendu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Écouteurs sans fil Pro</div>
            <p className="text-xs text-muted-foreground">1 245 unités vendues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur taux de livraison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">FedEx</div>
            <p className="text-xs text-muted-foreground">98,7% de livraisons à temps</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotation des stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,2x</div>
            <p className="text-xs text-muted-foreground">+0,4x par rapport au trimestre précédent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Performance des produits</TabsTrigger>
          <TabsTrigger value="sales">Analyse des ventes</TabsTrigger>
          <TabsTrigger value="delivery">Performance de livraison</TabsTrigger>
          <TabsTrigger value="inventory">Analyse de l'inventaire</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="space-y-4">
          <ProductPerformanceStats />
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <SalesPerformanceStats />
        </TabsContent>
        <TabsContent value="delivery" className="space-y-4">
          <DeliveryPerformanceStats />
        </TabsContent>
        <TabsContent value="inventory" className="space-y-4">
          <InventoryPerformanceStats />
        </TabsContent>
      </Tabs>
    </div>
  )
}
