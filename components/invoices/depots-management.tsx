"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, Plus, Save, Edit, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"

export type Depot = {
  id: string
  name: string
  location: string
  manager: string
  capacity: string
  status: "active" | "inactive" | "maintenance"
  priority?: "principale" | "secondaire" | "tertiaire"
  type?: "principale" | "secondaire" | "tertiaire"
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
  const [depots, setDepots] = useState<Depot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchDepots = async () => {
      setIsLoading(true)
      try {
        const depotsCollection = collection(db, "depots")
        const depotsSnapshot = await getDocs(depotsCollection)
        const depotsList = depotsSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || "Dépôt sans nom",
            location: data.location || "",
            manager: data.manager || "",
            capacity: data.capacity || "",
            status: data.status || "active",
            priority: data.priority || "principale",
            quantity: data.quantity || 0,
            type: data.type || "principale",
            productId: data.productId || "",
            productName: data.productName || "",
          }
        })
        setDepots(depotsList)
      } catch (error) {
        console.error("Error fetching depots:", error)
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des dépôts.",
          variant: "destructive",
        })

        // Fallback to default depots if Firebase fetch fails
        setDepots([
          {
            id: "depot1",
            name: "Dépôt Principal",
            priority: "principale",
            location: "Alger",
            manager: "Mohamed",
            capacity: "5000 m²",
            status: "active",
            quantity: 120,
          },
          {
            id: "depot2",
            name: "Dépôt Secondaire",
            priority: "secondaire",
            location: "Oran",
            manager: "Ahmed",
            capacity: "3000 m²",
            status: "active",
            quantity: 85,
          },
          {
            id: "depot3",
            name: "Dépôt Tertiaire",
            priority: "tertiaire",
            location: "Constantine",
            manager: "Karim",
            capacity: "2000 m²",
            status: "active",
            quantity: 50,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      fetchDepots()
    }
  }, [open])

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

  const handleAddDepot = async () => {
    if (!newDepot.name || !newDepot.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Add to Firebase
      const depotsCollection = collection(db, "depots")
      const docRef = await addDoc(depotsCollection, {
        ...newDepot,
        type: newDepot.priority, // Ensure type is set to match priority
      })

      // Add to local state with Firebase ID
      const depot: Depot = {
        ...newDepot,
        id: docRef.id,
        type: newDepot.priority, // Ensure type is set to match priority
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
    } catch (error) {
      console.error("Error adding depot:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du dépôt.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditDepot = (depot: Depot) => {
    setEditingDepot(depot)
  }

  const handleUpdateDepot = async () => {
    if (!editingDepot) return

    if (!editingDepot.name || !editingDepot.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Update in Firebase
      const depotRef = doc(db, "depots", editingDepot.id)
      await updateDoc(depotRef, {
        ...editingDepot,
        type: editingDepot.priority, // Ensure type is set to match priority
      })

      // Update in local state
      setDepots(depots.map((d) => (d.id === editingDepot.id ? { ...editingDepot, type: editingDepot.priority } : d)))
      setEditingDepot(null)

      toast({
        title: "Dépôt mis à jour",
        description: `Le dépôt ${editingDepot.name} a été mis à jour avec succès.`,
      })
    } catch (error) {
      console.error("Error updating depot:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du dépôt.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDepot = async (id: string) => {
    setIsSaving(true)
    try {
      // Delete from Firebase
      const depotRef = doc(db, "depots", id)
      await deleteDoc(depotRef)

      // Delete from local state
      setDepots(depots.filter((d) => d.id !== id))

      toast({
        title: "Dépôt supprimé",
        description: "Le dépôt a été supprimé avec succès.",
      })
    } catch (error) {
      console.error("Error deleting depot:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du dépôt.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
                  disabled={isSaving}
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
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Responsable</Label>
                <Input
                  id="manager"
                  value={editingDepot ? editingDepot.manager : newDepot.manager}
                  onChange={(e) => handleInputChange("manager", e.target.value)}
                  placeholder="ex: Mohamed Ali"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité</Label>
                <Input
                  id="capacity"
                  value={editingDepot ? editingDepot.capacity : newDepot.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  placeholder="ex: 5000 m²"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingDepot ? editingDepot.priority : newDepot.priority}
                  onChange={(e) => handleInputChange("priority", e.target.value as Depot["priority"])}
                  disabled={isSaving}
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
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <select
                  id="status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingDepot ? editingDepot.status : newDepot.status}
                  onChange={(e) => handleInputChange("status", e.target.value as Depot["status"])}
                  disabled={isSaving}
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
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit associé</Label>
                <Input
                  id="productName"
                  value={editingDepot ? editingDepot.productName : newDepot.productName}
                  onChange={(e) => handleInputChange("productName", e.target.value)}
                  placeholder="ex: T-Shirt, T-Shirt Rouge S"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="flex justify-end">
              {editingDepot ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => setEditingDepot(null)}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                  <Button type="button" onClick={handleUpdateDepot} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Mettre à jour
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={handleAddDepot} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Liste des dépôts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Liste des dépôts</h3>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Chargement des dépôts...</span>
              </div>
            ) : (
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
                    {depots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-4">
                          Aucun dépôt trouvé. Ajoutez-en un pour commencer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      depots.map((depot) => (
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
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDepot(depot)}
                                disabled={isSaving}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDepot(depot.id)}
                                disabled={isSaving}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
