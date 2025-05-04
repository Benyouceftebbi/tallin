import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Download, Plus } from "lucide-react"
import { MovementTrackingTable } from "@/components/movement/movement-tracking-table"

export default function MovementPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Mouvement de Stock</h2>
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
            <CardTitle className="text-sm font-medium">Total des entrées aujourd'hui</CardTitle>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">152</div>
            <p className="text-xs text-muted-foreground">+24 par rapport à hier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des sorties aujourd'hui</CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">-12 par rapport à hier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur des entrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 450,00 €</div>
            <p className="text-xs text-muted-foreground">+15% par rapport à hier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur des sorties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 320,50 €</div>
            <p className="text-xs text-muted-foreground">-8% par rapport à hier</p>
          </CardContent>
        </Card>
      </div>

      <MovementTrackingTable />
    </div>
  )
}
