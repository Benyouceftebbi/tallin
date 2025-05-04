import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Plus, Search } from "lucide-react"
import { InventoryMovements } from "@/components/inventory/inventory-movements"
import { InventoryTrackingTable } from "@/components/inventory/inventory-tracking-table"
import { DailyMovementTracking } from "@/components/inventory/daily-movement-tracking"
import { CashFlowTracking } from "@/components/inventory/cash-flow-tracking"
import { CashFlowButtons } from "@/components/inventory/cash-flow-buttons"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventaire</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Enregistrer un mouvement
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale du stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 245 890,00 €</div>
            <p className="text-xs text-muted-foreground">+2,5% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles en stock faible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">8 articles nécessitent un réapprovisionnement immédiat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de rotation des stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,2x</div>
            <p className="text-xs text-muted-foreground">Par an (moyenne du secteur: 3,8x)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jours moyens en stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">-5 jours par rapport au trimestre précédent</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <CashFlowButtons />
      </div>

      <Tabs defaultValue="tracking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tracking">Suivi des stocks</TabsTrigger>
          <TabsTrigger value="daily">Mouvements quotidiens</TabsTrigger>
          <TabsTrigger value="cashflow">Flux de trésorerie</TabsTrigger>
          <TabsTrigger value="movements">Historique des mouvements</TabsTrigger>
          <TabsTrigger value="adjustments">Ajustements</TabsTrigger>
          <TabsTrigger value="transfers">Transferts</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-4">
          <InventoryTrackingTable />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <DailyMovementTracking />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowTracking />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher dans l'inventaire..." className="pl-8" />
            </div>
            <div className="flex space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les mouvements</SelectItem>
                  <SelectItem value="inflow">Entrées de stock</SelectItem>
                  <SelectItem value="outflow">Sorties de stock</SelectItem>
                  <SelectItem value="adjustment">Ajustements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <InventoryMovements />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajustements d'inventaire</CardTitle>
              <CardDescription>
                Consultez et gérez les ajustements d'inventaire dus aux dommages, pertes ou comptages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aucun ajustement enregistré au cours des 30 derniers jours.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transferts d'inventaire</CardTitle>
              <CardDescription>Suivez les mouvements d'inventaire entre les emplacements ou entrepôts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aucun transfert enregistré au cours des 30 derniers jours.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
