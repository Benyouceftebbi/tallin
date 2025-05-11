import { RetourTable } from "@/components/retour-table"

export const metadata = {
  title: "Commandes retournées",
  description: "Gérez les commandes retournées",
}

export default function RetourPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Commandes retournées</h1>
      <RetourTable />
    </div>
  )
}
