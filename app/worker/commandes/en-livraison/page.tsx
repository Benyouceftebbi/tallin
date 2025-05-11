import { EnLivraisonTable } from "@/components/en-livraison-table"

export const metadata = {
  title: "Commandes en livraison",
  description: "Gérez les commandes en cours de livraison",
}

export default function EnLivraisonPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Commandes en livraison</h1>
      <EnLivraisonTable />
    </div>
  )
}
