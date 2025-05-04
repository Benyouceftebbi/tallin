import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, ShoppingCart, Truck } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "order",
    title: "Nouvelle commande #38293",
    description: "Client: Jean Dupont",
    time: "il y a 5 minutes",
    icon: ShoppingCart,
    iconColor: "text-blue-500 bg-blue-100",
  },
  {
    id: 2,
    type: "inflow",
    title: "Stock reçu",
    description: "Écouteurs sans fil Pro (+50)",
    time: "il y a 1 heure",
    icon: ArrowDown,
    iconColor: "text-green-500 bg-green-100",
  },
  {
    id: 3,
    type: "outflow",
    title: "Stock expédié",
    description: "Commande #38291 traitée",
    time: "il y a 2 heures",
    icon: ArrowUp,
    iconColor: "text-red-500 bg-red-100",
  },
  {
    id: 4,
    type: "delivery",
    title: "Livraison terminée",
    description: "Commande #38289 livrée par FedEx",
    time: "il y a 3 heures",
    icon: Truck,
    iconColor: "text-purple-500 bg-purple-100",
  },
  {
    id: 5,
    type: "inflow",
    title: "Stock reçu",
    description: "Portefeuille en cuir premium (+100)",
    time: "il y a 5 heures",
    icon: ArrowDown,
    iconColor: "text-green-500 bg-green-100",
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex">
          <div className="relative mr-4">
            <div className={`rounded-full p-2 ${activity.iconColor}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            {activity.id !== activities.length && (
              <div className="absolute top-10 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border" />
            )}
          </div>
          <div className="flex flex-col space-y-1 pb-8">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{activity.title}</p>
              {activity.type === "inflow" && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Entrée stock
                </Badge>
              )}
              {activity.type === "outflow" && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Sortie stock
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
