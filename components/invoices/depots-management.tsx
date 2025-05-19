"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, Plus, Save, Edit } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export type Depot = {
  id: string
  name: string
  location: string
  manager: string
  capacity: string
  status: "active" | "inactive" | "maintenance"
  priority?: "principale" | "secondaire" | "tertiaire"
  quantity?: number
  productId?: string // Add this field to associate depots with products
  productName?: string // Add this field for display purposes
}

interface DepotsManagementProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectDepot?: (depot: Depot) => void
  selectable?: boolean
}

export function DepotsManagement({ open, onOpenChange, onSelectDepot, selectable = false }: DepotsManagementProps) {
  const [depots, setDepots] = useState<Depot[]>([
    {
      id: "depot1",
      name: "Dépôt A",
      location: "Zone Industrielle, Alger",
      manager: "Mohamed Ali",
      capacity: "5000 m²",
      status: "active",
      priority: "principale",
      quantity: 500,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot2",
      name: "Dépôt B",
      location: "Centre Ville, Oran",
      manager: "Karim Benzema",
      capacity: "2500 m²",
      status: "active",
      priority: "principale",
      quantity: 300,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot3",
      name: "Dépôt C",
      location: "Port, Annaba",
      manager: "Sofiane Feghouli",
      capacity: "3000 m²",
      status: "maintenance",
      priority: "principale",
      quantity: 400,
      productId: "prod3",
      productName: "Chemise",
    },
    {
      id: "depot4",
      name: "Dépôt A2",
      location: "Zone Industrielle, Alger",
      manager: "Ahmed Benali",
      capacity: "2000 m²",
      status: "active",
      priority: "secondaire",
      quantity: 200,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot5",
      name: "Dépôt B2",
      location: "Centre Ville, Oran",
      manager: "Yacine Brahimi",
      capacity: "1500 m²",
      status: "active",
      priority: "secondaire",
      quantity: 150,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot6",
      name: "Dépôt C2",
      location: "Port, Annaba",
      manager: "Riyad Mahrez",
      capacity: "1800 m²",
      status: "active",
      priority: "secondaire",
      quantity: 180,
      productId: "prod3",
      productName: "Chemise",
    },
    // Add variant-specific depots
    {
      id: "depot-var1-main",
      name: "Dépôt T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Ismail Bennacer",
      capacity: "500 m²",
      status: "active",
      priority: "principale",
      quantity: 30,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var1-sec",
      name: "Dépôt Secondaire T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Islam Slimani",
      capacity: "300 m²",
      status: "active",
      priority: "secondaire",
      quantity: 15,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var2-main",
      name: "Dépôt T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Aissa Mandi",
      capacity: "400 m²",
      status: "active",
      priority: "principale",
      quantity: 25,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
    {
      id: "depot-var2-sec",
      name: "Dépôt Secondaire T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Youcef Atal",
      capacity: "250 m²",
      status: "active",
      priority: "secondaire",
      quantity: 10,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
  ])

  const [newDepot, setNewDepot] = useState<Omit<Depot, "id">>({
    name: "",
    location: "",
    manager: "",
    capacity: "",
    status: "active",
    priority: "principale",
    quantity: 0,
    productId: "",
    productName: "",
  })

  const [editingDepot, setEditingDepot] = useState<Depot | null>(null)

  const handleInputChange = (field: keyof Omit<Depot, "id">, value: any) => {
    if (editingDepot) {
      setEditingDepot({
        ...editingDepot,
        [field]: value,
      })
    } else {
      setNewDepot({
        ...newDepot,
        [field]: value,
      })
    }
  }

  const handleAddDepot = () => {
    if (!newDepot.name || !newDepot.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    const depot: Depot = {
      ...newDepot,
      id: `depot-${Date.now()}`,
    }

    setDepots([...depots, depot])
    setNewDepot({
      name: "",
      location: "",
      manager: "",
      capacity: "",
      status: "active",
      priority: "principale",
      quantity: 0,
      productId: "",
      productName: "",
    })

    toast({
      title: "Dépôt ajouté",
      description: `Le dépôt ${depot.name} a été ajouté avec succès.`,
    })
  }

  const handleEditDepot = (depot: Depot) => {
    setEditingDepot(depot)
  }

  const handleUpdateDepot = () => {
    if (!editingDepot) return

    if (!editingDepot.name || !editingDepot.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    setDepots(depots.map((d) => (d.id === editingDepot.id ? editingDepot : d)))
    setEditingDepot(null)

    toast({
      title: "Dépôt mis à jour",
      description: `Le dépôt ${editingDepot.name} a été mis à jour avec succès.`,
    })
  }

  const handleDeleteDepot = (id: string) => {
    setDepots(depots.filter((d) => d.id !== id))
    toast({
      title: "Dépôt supprimé",
      description: "Le dépôt a été supprimé avec succès.",
    })
  }

  const handleSelectDepot = (depot: Depot) => {
    if (onSelectDepot) {
      onSelectDepot(depot)
      onOpenChange(false)
    }
  }

  const getStatusBadge = (status: Depot["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">En maintenance</Badge>
      default:
        return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestion des dépôts</SheetTitle>
          <SheetDescription>Ajoutez, modifiez ou supprimez des dépôts.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Formulaire d'ajout/modification */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{editingDepot ? "Modifier le dépôt" : "Ajouter un dépôt"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du dépôt *</Label>
                <Input
                  id="name"
                  value={editingDepot ? editingDepot.name : newDepot.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="ex: Dépôt Principal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement *</Label>
                <Input
                  id="location"
                  value={editingDepot ? editingDepot.location : newDepot.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="ex: Zone Industrielle, Alger"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Responsable</Label>
                <Input
                  id="manager"
                  value={editingDepot ? editingDepot.manager : newDepot.manager}
                  onChange={(e) => handleInputChange("manager", e.target.value)}
                  placeholder="ex: Mohamed Ali"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  value={editingDepot ? editingDepot.capacity : newDepot.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  placeholder="ex: 5000 m²"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingDepot ? editingDepot.priority : newDepot.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value as Depot["priority"])}
                >
                  <option value="principale">Principale</option>
                  <option value="secondaire">Secondaire</option>
                  <option value="tertiaire">Tertiaire</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={editingDepot ? editingDepot.quantity : newDepot.quantity}
                  onChange={(e) => handleInputChange("quantity", Number.parseInt(e.target.value) || 0)}
                  placeholder="ex: 500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingDepot ? editingDepot.status : newDepot.status}
                  onChange={(e) => handleInputChange("status", e.target.value as Depot["status"])}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="maintenance">En maintenance</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productId">ID du produit associé</Label>
                <Input
                  id="productId"
                  value={editingDepot ? editingDepot.productId : newDepot.productId}
                  onChange={(e) => handleInputChange("productId", e.target.value)}
                  placeholder="ex: prod1, var1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit associé</Label>
                <Input
                  id="productName"
                  value={editingDepot ? editingDepot.productName : newDepot.productName}
                  onChange={(e) => handleInputChange("productName", e.target.value)}
                  placeholder="ex: T-Shirt, T-Shirt Rouge S"
                />
              </div>
            </div>
            <div className="flex justify-end">
              {editingDepot ? (
                <>
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setEditingDepot(null)}>
                    Annuler
                  </Button>
                  <Button type="button" onClick={handleUpdateDepot}>
                    <Save className="h-4 w-4 mr-2" />
                    Mettre à jour
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={handleAddDepot}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
          </div>

          {/* Liste des dépôts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Liste des dépôts</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Emplacement</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Capacité</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Produit associé</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depots.map((depot) => (
                    <TableRow key={depot.id} className={selectable ? "cursor-pointer hover:bg-muted/50" : ""}>
                      <TableCell className="font-medium" onClick={() => selectable && handleSelectDepot(depot)}>
                        {depot.name}
                      </TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>{depot.location}</TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>{depot.manager}</TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>{depot.capacity}</TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>
                        {depot.priority === "principale"
                          ? "Principale"
                          : depot.priority === "secondaire"
                            ? "Secondaire"
                            : "Tertiaire"}
                      </TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>
                        {depot.quantity || 0}
                      </TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>
                        {getStatusBadge(depot.status)}
                      </TableCell>
                      <TableCell onClick={() => selectable && handleSelectDepot(depot)}>
                        {depot.productName || "Non spécifié"} {depot.productId ? `(${depot.productId})` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleEditDepot(depot)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteDepot(depot.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
