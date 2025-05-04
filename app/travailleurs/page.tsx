"use client"

import { useState } from "react"
import { Search, MoreHorizontal, Mail, Phone, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { type Worker, WorkerFormModal } from "@/components/worker-form-modal"
import { PaymentCalculatorModal } from "@/components/payment-calculator-modal"

// Données simulées pour les travailleurs
const initialWorkers: Worker[] = [
  {
    id: 1,
    name: "Thomas Dubois",
    role: "Livreur",
    email: "thomas.dubois@example.com",
    phone: "+33 6 12 34 56 78",
    status: "Actif",
    region: "Alger",
    parcelsDelivered: 156,
    paymentMethod: "Par commande",
    paymentRate: {
      perDelivery: 200,
      perReturn: 50,
    },
    avatar: "/placeholder.svg?height=40&width=40",
    dateHired: "2023-01-15",
  },
  {
    id: 2,
    name: "Sophie Martin",
    role: "Livreur",
    email: "sophie.martin@example.com",
    phone: "+33 6 23 45 67 89",
    status: "Actif",
    region: "Oran",
    parcelsDelivered: 132,
    paymentMethod: "Par commande",
    paymentRate: {
      perDelivery: 180,
      perReturn: 45,
    },
    avatar: "/placeholder.svg?height=40&width=40",
    dateHired: "2023-02-10",
  },
  {
    id: 3,
    name: "Lucas Bernard",
    role: "Préparateur",
    email: "lucas.bernard@example.com",
    phone: "+33 6 34 56 78 90",
    status: "Actif",
    region: "Alger",
    parcelsDelivered: 0,
    paymentMethod: "Par article",
    paymentRate: {
      perArticle: 30,
    },
    avatar: "/placeholder.svg?height=40&width=40",
    dateHired: "2023-03-05",
  },
  {
    id: 4,
    name: "Emma Petit",
    role: "Préparateur",
    email: "emma.petit@example.com",
    phone: "+33 6 45 67 89 01",
    status: "En congé",
    region: "Constantine",
    parcelsDelivered: 0,
    paymentMethod: "Par commande",
    paymentRate: {
      perConfirmation: 80,
    },
    avatar: "/placeholder.svg?height=40&width=40",
    dateHired: "2023-04-20",
  },
  {
    id: 5,
    name: "Hugo Leroy",
    role: "Dispatcher",
    email: "hugo.leroy@example.com",
    phone: "+33 6 56 78 90 12",
    status: "Actif",
    region: "Alger",
    parcelsDelivered: 0,
    paymentMethod: "Par commande",
    paymentRate: {
      perDispatch: 50,
    },
    avatar: "/placeholder.svg?height=40&width=40",
    dateHired: "2023-05-15",
  },
  {
    id: 6,
    name: "Leila Meziane",
    role: "Confirmatrice",
    email: "leila.meziane@example.com",
    phone: "+213 5 55 34 23 45",
    status: "Actif",
    region: "Alger",
    parcelsDelivered: 0,
    paymentMethod: "Confirmation uniquement",
    paymentRate: {
      confirmationOnly: 50,
    },
    avatar: "/placeholder.svg?height=40&width=40",
    dateHired: "2023-06-01",
  },
]

export default function TravailleursPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | undefined>()

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.region.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Actif":
        return "bg-green-100 text-green-800"
      case "En congé":
        return "bg-yellow-100 text-yellow-800"
      case "Inactif":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddWorker = (workerData: Omit<Worker, "id" | "parcelsDelivered">) => {
    const newWorker: Worker = {
      ...workerData,
      id: workers.length > 0 ? Math.max(...workers.map((w) => w.id)) + 1 : 1,
      parcelsDelivered: 0,
    }

    setWorkers([...workers, newWorker])
    toast({
      title: "Travailleur ajouté",
      description: `${newWorker.name} a été ajouté avec succès.`,
    })
  }

  const handleEditWorker = (workerData: Omit<Worker, "id" | "parcelsDelivered">) => {
    if (!selectedWorker) return

    const updatedWorkers = workers.map((worker) =>
      worker.id === selectedWorker.id ? { ...worker, ...workerData } : worker,
    )

    setWorkers(updatedWorkers)
    toast({
      title: "Travailleur modifié",
      description: `Les informations de ${workerData.name} ont été mises à jour.`,
    })
  }

  const handleDeleteWorker = (id: number) => {
    setWorkers(workers.filter((worker) => worker.id !== id))
    toast({
      title: "Travailleur supprimé",
      description: "Le travailleur a été supprimé avec succès.",
    })
  }

  const handleOpenEditModal = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsFormModalOpen(true)
  }

  const handleOpenPaymentModal = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsPaymentModalOpen(true)
  }

  const getWorkerTypeCount = (type: string) => {
    return workers.filter((worker) => worker.role === type && worker.status === "Actif").length
  }

  const getPaymentMethodLabel = (worker: Worker) => {
    switch (worker.paymentMethod) {
      case "Par commande":
        return "Par commande"
      case "Par article":
        return "Par article"
      case "Confirmation uniquement":
        return "Par confirmation"
      case "Tarif fixe":
        return "Fixe"
      case "Tarif horaire":
        return "Horaire"
      default:
        return worker.paymentMethod
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Travailleurs</h1>
          <p className="text-muted-foreground">Gérez votre équipe de livreurs, préparateurs et confirmatrices.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedWorker(undefined)
            setIsFormModalOpen(true)
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un travailleur
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total des travailleurs</CardTitle>
            <CardDescription>Nombre d'employés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workers.length}</div>
            <p className="text-xs text-muted-foreground">
              {workers.filter((w) => w.status === "Actif").length} actifs,{" "}
              {workers.filter((w) => w.status === "En congé").length} en congé,{" "}
              {workers.filter((w) => w.status === "Inactif").length} inactifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Confirmatrices</CardTitle>
            <CardDescription>Personnel de confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getWorkerTypeCount("Confirmatrice")}</div>
            <p className="text-xs text-muted-foreground">Confirmation et service client</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Préparateurs</CardTitle>
            <CardDescription>Personnel de préparation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getWorkerTypeCount("Préparateur")}</div>
            <p className="text-xs text-muted-foreground">Préparation des commandes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Livreurs</CardTitle>
            <CardDescription>Personnel de livraison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{getWorkerTypeCount("Livreur")}</div>
            <p className="text-xs text-muted-foreground">Livraisons et retours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des travailleurs</CardTitle>
          <CardDescription>Gérez les membres de votre équipe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un travailleur..."
                  className="w-full pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Région</TableHead>
                    <TableHead className="hidden lg:table-cell">Mode de paiement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={worker.avatar || "/placeholder.svg"} alt={worker.name} />
                            <AvatarFallback>{worker.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{worker.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{worker.role}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{worker.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{worker.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(worker.status)} variant="outline">
                          {worker.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{worker.region}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          {getPaymentMethodLabel(worker)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenEditModal(worker)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenPaymentModal(worker)}>
                              Calculer paiement
                            </DropdownMenuItem>
                            <DropdownMenuItem>Changer le statut</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteWorker(worker.id)}>
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" disabled>
            Précédent
          </Button>
          <Button variant="outline" size="sm">
            Suivant
          </Button>
        </CardFooter>
      </Card>

      {/* Worker Form Modal */}
      <WorkerFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        worker={selectedWorker}
        onSubmit={selectedWorker ? handleEditWorker : handleAddWorker}
      />

      {/* Payment Calculator Modal */}
      {selectedWorker && (
        <PaymentCalculatorModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          worker={selectedWorker}
        />
      )}
    </div>
  )
}
