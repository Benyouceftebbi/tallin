import { AnnuleTable} from "@/components/annule-table"

export const metadata = {
  title: "Commandes à dispatcher",
  description: "Gérez les commandes prêtes à être dispatchées",
}

export default function DispatcherPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Commandes à dispatcher</h1>
      <AnnuleTable />
    </div>
  )
}
