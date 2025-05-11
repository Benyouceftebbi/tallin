"use client"

import { useState } from "react"
import {
  Download,
  FileText,
  Filter,
  Search,
  MoreHorizontal,
  Calculator,
  CreditCard,
  FileDown,
  Barcode,
} from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeliverymanDetailsSheet } from "@/components/deliveryman-details-sheet"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// Données simulées pour les travailleurs et leurs performances
const workers = [
  {
    id: 1,
    name: "Thomas Dubois",
    role: "Livreur",
    email: "thomas.dubois@example.com",
    phone: "+33 6 12 34 56 78",
    region: "Paris",
    ordersAssigned: 168,
    ordersDelivered: 156,
    ordersReturned: 12,
    paymentStatus: "Non payé",
    paymentMethod: "Par commande",
    paymentRate: {
      perDelivery: 2.5,
      perReturn: 1.0,
      commission: {
        type: "percentage",
        value: 2.5,
      },
    },
    calculatedPayment: 390, // 156 * 2.5 + 12 * 1.0
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40",
    parcelsAssigned: 168,
    parcelsDelivered: 156,
    parcelsReturned: 12,
  },
  {
    id: 2,
    name: "Sophie Martin",
    role: "Livreur",
    email: "sophie.martin@example.com",
    phone: "+33 6 23 45 67 89",
    region: "Lyon",
    ordersAssigned: 145,
    ordersDelivered: 132,
    ordersReturned: 13,
    paymentStatus: "Non payé",
    paymentMethod: "Par commande",
    paymentRate: {
      perDelivery: 2.5,
      perReturn: 1.0,
    },
    calculatedPayment: 343, // 132 * 2.5 + 13 * 1.0
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40",
    parcelsAssigned: 145,
    parcelsDelivered: 132,
    parcelsReturned: 13,
  },
  {
    id: 3,
    name: "Lucas Bernard",
    role: "Préparateur",
    email: "lucas.bernard@example.com",
    phone: "+33 6 34 56 78 90",
    region: "Paris",
    ordersConfirmed: 210,
    articlesProcessed: 630, // Supposons une moyenne de 3 articles par commande
    ordersReturned: 5,
    paymentStatus: "Non payé",
    paymentMethod: "Par article",
    paymentRate: {
      perArticle: 0.4,
      commission: {
        type: "fixed",
        value: 500,
      },
    },
    calculatedPayment: 252, // 630 * 0.4
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "Emma Petit",
    role: "Préparateur",
    email: "emma.petit@example.com",
    phone: "+33 6 45 67 89 01",
    region: "Marseille",
    ordersConfirmed: 185,
    articlesProcessed: 555, // Supposons une moyenne de 3 articles par commande
    ordersReturned: 3,
    paymentStatus: "Non payé",
    paymentMethod: "Par commande",
    paymentRate: {
      perConfirmation: 1.2,
      commission: {
        type: "percentage",
        value: 1.5,
      },
    },
    calculatedPayment: 222, // 185 * 1.2
    status: "En congé",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 5,
    name: "Hugo Leroy",
    role: "Dispatcher",
    email: "hugo.leroy@example.com",
    phone: "+33 6 56 78 90 12",
    region: "Paris",
    ordersDispatched: 320,
    paymentStatus: "Non payé",
    paymentMethod: "Par commande",
    paymentRate: {
      perDispatch: 0.8,
    },
    calculatedPayment: 256, // 320 * 0.8
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 6,
    name: "Léa Moreau",
    role: "Livreur",
    email: "lea.moreau@example.com",
    phone: "+33 6 67 89 01 23",
    region: "Lille",
    ordersAssigned: 95,
    ordersDelivered: 87,
    ordersReturned: 8,
    paymentStatus: "Payé",
    paymentMethod: "Par commande",
    paymentRate: {
      perDelivery: 2.5,
      perReturn: 1.0,
    },
    calculatedPayment: 225.5, // Déjà calculé pour cet exemple
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40",
    parcelsAssigned: 95,
    parcelsDelivered: 87,
    parcelsReturned: 8,
  },
  {
    id: 7,
    name: "Amina Benali",
    role: "Confirmatrice",
    email: "amina.benali@example.com",
    phone: "+213 5 55 67 89 12",
    region: "Alger",
    ordersConfirmed: 245,
    paymentStatus: "Non payé",
    paymentMethod: "Confirmation uniquement",
    paymentRate: {
      confirmationOnly: 0.9,
    },
    calculatedPayment: 220.5, // 245 * 0.9
    status: "Actif",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

// Historique des paiements
const paymentHistory = [
  {
    id: "PAY-2023-001",
    worker: "Léa Moreau",
    date: "15/04/2023",
    amount: 225.5,
    period: "Mars 2023",
    method: "Virement bancaire",
  },
  {
    id: "PAY-2023-002",
    worker: "Thomas Dubois",
    date: "15/03/2023",
    amount: 312.75,
    period: "Février 2023",
    method: "Virement bancaire",
  },
  {
    id: "PAY-2023-003",
    worker: "Sophie Martin",
    date: "15/03/2023",
    amount: 287.5,
    period: "Février 2023",
    method: "Virement bancaire",
  },
  {
    id: "PAY-2023-004",
    worker: "Lucas Bernard",
    date: "15/03/2023",
    amount: 198.0,
    period: "Février 2023",
    method: "Virement bancaire",
  },
]

export default function FacturationPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [barcodeValue, setBarcodeValue] = useState("")
  const [scannedWorker, setScannedWorker] = useState<any>(null)

  const filteredWorkers = workers.filter(
    (worker) =>
      (worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === "all" || worker.role === roleFilter) &&
      (paymentStatusFilter === "all" || worker.paymentStatus === paymentStatusFilter) &&
      worker.role !== "Dispatcher", // Add this line to filter out dispatchers
  )

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Payé":
        return "bg-green-100 text-green-800"
      case "Non payé":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculer les totaux
  const totalToPay = filteredWorkers
    .filter((worker) => worker.paymentStatus === "Non payé")
    .reduce((sum, worker) => sum + worker.calculatedPayment, 0)

  const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)

  // Gérer le scan de code-barres
  const handleBarcodeSubmit = (e) => {
    e.preventDefault()

    if (!barcodeValue.trim()) {
      toast({
        title: "Code-barres vide",
        description: "Veuillez scanner un code-barres valide.",
        variant: "destructive",
      })
      return
    }

    // Simuler la recherche d'un travailleur par code-barres
    // Dans un cas réel, cela serait lié à une base de données
    const worker = workers.find((w) => w.id.toString() === barcodeValue.trim())

    if (worker) {
      setScannedWorker(worker)
      setSelectedWorker(worker)
      setIsDetailsSheetOpen(true)
      toast({
        title: "Travailleur trouvé",
        description: `${worker.name} a été trouvé et sélectionné.`,
      })
    } else {
      toast({
        title: "Code-barres non trouvé",
        description: "Aucun travailleur trouvé avec ce code-barres.",
        variant: "destructive",
      })
    }

    setBarcodeValue("")
  }

  // Fonction pour afficher les performances selon le rôle
  const renderPerformance = (worker) => {
    switch (worker.role) {
      case "Livreur":
        return (
          <div className="text-xs">
            <div>
              {worker.ordersDelivered} livrés / {worker.ordersReturned} retournés
            </div>
            <div className="text-muted-foreground">
              Taux: {((worker.ordersDelivered / worker.ordersAssigned) * 100).toFixed(1)}%
              {worker.paymentRate.commission && (
                <span className="ml-2 text-cyan-500">
                  +{" "}
                  {worker.paymentRate.commission.type === "percentage"
                    ? `${worker.paymentRate.commission.value}%`
                    : `${worker.paymentRate.commission.value} DA`}
                </span>
              )}
            </div>
          </div>
        )
      case "Préparateur":
        if (worker.paymentMethod === "Par article") {
          return (
            <div className="text-xs">
              <div>{worker.articlesProcessed} articles traités</div>
              <div className="text-muted-foreground">
                {worker.ordersConfirmed} commandes ({(worker.articlesProcessed / worker.ordersConfirmed).toFixed(1)}{" "}
                articles/commande)
                {worker.paymentRate.commission && (
                  <span className="ml-2 text-cyan-500">
                    +{" "}
                    {worker.paymentRate.commission.type === "percentage"
                      ? `${worker.paymentRate.commission.value}%`
                      : `${worker.paymentRate.commission.value} DA`}
                  </span>
                )}
              </div>
            </div>
          )
        } else {
          return (
            <div className="text-xs">
              <div>{worker.ordersConfirmed} commandes préparées</div>
              <div className="text-muted-foreground">
                Taux de retour: {((worker.ordersReturned / worker.ordersConfirmed) * 100).toFixed(1)}%
                {worker.paymentRate.commission && (
                  <span className="ml-2 text-cyan-500">
                    +{" "}
                    {worker.paymentRate.commission.type === "percentage"
                      ? `${worker.paymentRate.commission.value}%`
                      : `${worker.paymentRate.commission.value} DA`}
                  </span>
                )}
              </div>
            </div>
          )
        }
      case "Confirmatrice":
        return (
          <div className="text-xs">
            <div>{worker.ordersConfirmed} commandes confirmées</div>
            <div className="text-muted-foreground">
              {worker.paymentMethod === "Confirmation uniquement"
                ? "Paiement par confirmation"
                : "Paiement par commande"}
              {worker.paymentRate.commission && (
                <span className="ml-2 text-cyan-500">
                  +{" "}
                  {worker.paymentRate.commission.type === "percentage"
                    ? `${worker.paymentRate.commission.value}%`
                    : `${worker.paymentRate.commission.value} DA`}
                </span>
              )}
            </div>
          </div>
        )
      case "Dispatcher":
        return (
          <div className="text-xs">
            <div>{worker.ordersDispatched} dispatché</div>
          </div>
        )
      default:
        return null
    }
  }

  // Fonction pour afficher le mode de paiement
  const getPaymentMethodBadge = (worker) => {
    let badgeText = ""

    switch (worker.paymentMethod) {
      case "Par commande":
        badgeText = "Par commande"
        break
      case "Par article":
        badgeText = "Par article"
        break
      case "Confirmation uniquement":
        badgeText = "Par confirmation"
        break
      default:
        badgeText = worker.paymentMethod
    }

    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-800">
        {badgeText}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <DeliverymanDetailsSheet
        open={isDetailsSheetOpen}
        onOpenChange={setIsDetailsSheetOpen}
        deliveryman={selectedWorker}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Facturation
          </h1>
          <p className="text-slate-400">Gérez les paiements des travailleurs basés sur leurs performances.</p>
        </div>
        <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
          <CreditCard className="mr-2 h-4 w-4" />
          Effectuer les paiements
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-100">À payer</CardTitle>
            <CardDescription>Montant total à payer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">€{totalToPay.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-100">Déjà payé</CardTitle>
            <CardDescription>Montant total déjà payé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-100">Période actuelle</CardTitle>
            <CardDescription>Période de facturation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Mai 2023</div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner de code-barres */}
      <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Scanner le code-barres d'un travailleur..."
            className="w-full pl-8 bg-slate-800/50 border-slate-700 focus-visible:ring-cyan-500"
            value={barcodeValue}
            onChange={(e) => setBarcodeValue(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
        >
          <Search className="h-4 w-4 mr-2" />
          Scanner
        </Button>
      </form>

      <Tabs defaultValue="workers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workers">Paiements des travailleurs</TabsTrigger>
          <TabsTrigger value="history">Historique des paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="workers" className="space-y-4 mt-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Paiements des travailleurs</CardTitle>
              <CardDescription>Calculez et gérez les paiements basés sur les performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="search"
                      placeholder="Rechercher un travailleur..."
                      className="w-full pl-8 bg-slate-800/50 border-slate-700 focus-visible:ring-cyan-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 focus:ring-cyan-500">
                        <SelectValue placeholder="Filtrer par rôle" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        <SelectItem value="Livreur">Livreur</SelectItem>
                        <SelectItem value="Préparateur">Préparateur</SelectItem>
                        <SelectItem value="Confirmatrice">Confirmatrice</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                      <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 focus:ring-cyan-500">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="Payé">Payé</SelectItem>
                        <SelectItem value="Non payé">Non payé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800/50 text-slate-400">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800/50 text-slate-400">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="hidden md:table-cell">Région</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Mode de paiement</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorkers.map((worker) => (
                        <TableRow
                          key={worker.id}
                          className={
                            scannedWorker && scannedWorker.id === worker.id
                              ? "bg-cyan-900/20 border-slate-800 hover:bg-slate-800/50"
                              : "border-slate-800 hover:bg-slate-800/50"
                          }
                        >
                          <TableCell className="font-medium">{worker.name}</TableCell>
                          <TableCell>{worker.role}</TableCell>
                          <TableCell className="hidden md:table-cell">{worker.region}</TableCell>
                          <TableCell>{renderPerformance(worker)}</TableCell>
                          <TableCell>{getPaymentMethodBadge(worker)}</TableCell>
                          <TableCell>€{worker.calculatedPayment.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={getPaymentStatusColor(worker.paymentStatus)} variant="outline">
                              {worker.paymentStatus}
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
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedWorker(worker)
                                    setIsDetailsSheetOpen(true)
                                  }}
                                >
                                  <Calculator className="mr-2 h-4 w-4" />
                                  <span>Détails du calcul</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  <span>Marquer comme payé</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileDown className="mr-2 h-4 w-4" />
                                  <span>Exporter le reçu</span>
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
              <Button variant="outline" size="sm" disabled className="border-slate-700 bg-slate-800/50 text-slate-400">
                Précédent
              </Button>
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 text-slate-400">
                Suivant
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-slate-100">Historique des paiements</CardTitle>
              <CardDescription>Consultez l'historique des paiements effectués</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Travailleur</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.worker}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>€{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{payment.method}</TableCell>
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
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Voir le reçu</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileDown className="mr-2 h-4 w-4" />
                                <span>Télécharger le reçu</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
