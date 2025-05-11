import { EnAttenteTable } from "@/components/en-attente-table"

export const metadata = {
  title: "Commandes en attente",
  description: "Gérez les commandes en attente de confirmation",
}

export default function EnAttentePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Commandes en attente</h1>
      <EnAttenteTable />
    </div>
  )
}
