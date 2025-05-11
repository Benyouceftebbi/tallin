import { LivresTable } from "@/components/livres-table"

export const metadata = {
  title: "Commandes livrées",
  description: "Gérez les commandes livrées",
}

export default function LivresPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Commandes livrées</h1>
      <LivresTable />
    </div>
  )
}
