"use client"

import { useState } from "react"
import { PlusCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeliverymanDetailsSheet } from "@/components/deliveryman-details-sheet"
import { WorkerFormModal } from "@/components/worker-form-modal"
import { useShop } from "@/context/shop-context"

export default function Travailleurs() {
  const { workers, loading } = useShop()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingWorker, setEditingWorker] = useState<string | null>(null)

  // Filtrer les travailleurs en fonction du terme de recherche
  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.phone.includes(searchTerm) ||
      worker.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Travailleurs</h1>
        <Button
          onClick={() => {
            setEditingWorker(null)
            setIsFormOpen(true)
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter un travailleur
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher par nom, téléphone ou rôle..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.map((worker) => (
          <Card key={worker.id} className={`overflow-hidden ${!worker.active ? "opacity-70" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{worker.name}</CardTitle>
                <Badge variant={worker.active ? "default" : "outline"}>{worker.active ? "Actif" : "Inactif"}</Badge>
              </div>
              <CardDescription>{worker.phone}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Rôle</p>
                  <p className="font-medium">{worker.role}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date d'embauche</p>
                  <p className="font-medium">{worker.joinDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Paiement</p>
                  <p className="font-medium">
                    {worker.paymentStructure.type === "fixed"
                      ? `${worker.paymentStructure.amount} DA par commande`
                      : `${worker.paymentStructure.amount}% du montant`}
                  </p>
                </div>
                {worker.commission && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Commission</p>
                    <p className="font-medium">
                      {worker.commission.type === "fixed"
                        ? `${worker.commission.amount} DA`
                        : `${worker.commission.amount}%`}
                      {worker.commission.threshold &&
                        worker.commission.thresholdType &&
                        ` après ${worker.commission.threshold} ${
                          worker.commission.thresholdType === "orders" ? "commandes" : "DA"
                        }`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingWorker(worker.id)
                  setIsFormOpen(true)
                }}
              >
                Modifier
              </Button>
              <Button variant="default" size="sm" onClick={() => setSelectedWorker(worker.id)}>
                Détails
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedWorker && (
        <DeliverymanDetailsSheet
          workerId={selectedWorker}
          open={!!selectedWorker}
          onOpenChange={(open) => {
            if (!open) setSelectedWorker(null)
          }}
        />
      )}

      <WorkerFormModal open={isFormOpen} onOpenChange={setIsFormOpen} workerId={editingWorker} />
    </div>
  )
}
