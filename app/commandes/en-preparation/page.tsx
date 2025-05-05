import EnPreparationTable from "@/components/en-preparation-table"


export const metadata = {
  title: "Commandes en préparation",
  description: "Gérez les commandes en cours de préparation",
}

export default function EnPreparationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Commandes en préparation</h1>
     <EnPreparationTable/>
    </div>
  )
}
