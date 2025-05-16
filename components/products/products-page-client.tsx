"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Plus, Search, TrendingUp, Package, DollarSign, BarChart3, Warehouse, Trash2, Loader2, AlertTriangle, Save, Pencil } from "lucide-react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductEditSheet } from "@/components/products/product-edit-sheet"
import { ShopifyImportModal } from "../shopify-import-modal"
import { toast } from "../ui/use-toast"
import  { useShop } from "@/context/shop-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
 "@/context/shop-context"
export function ProductsPageClient() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)

  // Depot management state
  const [isDepotSheetOpen, setIsDepotSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("list")
  const [depots, setDepots] = useState<Depot[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [currentDepot, setCurrentDepot] = useState<Depot | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [depotToDelete, setDepotToDelete] = useState<Depot | null>(null)
const { getDepots, addDepot, updateDepot, deleteDepot}=useShop()
  const fetchDepots = async () => {
    setLoading(true)
    try {
      const depotsData = await getDepots()
      setDepots(depotsData)
    } catch (error) {
      console.error("Error fetching depots:", error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les dépôts.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepot = async () => {
    if (!name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du dépôt est requis.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await addDepot({
        name,
        description,
        createdAt: new Date(),
      })
      toast({
        title: "Succès",
        description: `Le dépôt "${name}" a été créé.`,
      })
      setName("")
      setDescription("")
      setActiveTab("list")
      fetchDepots()
    } catch (error) {
      console.error("Error adding depot:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le dépôt.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (depot: Depot) => {
    setCurrentDepot(depot)
    setName(depot.name)
    setDescription(depot.description)
    setEditMode(true)
    setActiveTab("add")
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setCurrentDepot(null)
    setName("")
    setDescription("")
  }

  const handleUpdateDepot = async () => {
    if (!currentDepot || !currentDepot.id || !name.trim()) {
      toast({
        title: "Erreur",
        description: "Informations manquantes pour mettre à jour le dépôt.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await updateDepot({
        id: currentDepot.id,
        name,
        description,
        createdAt: currentDepot.createdAt,
      })
      toast({
        title: "Succès",
        description: `Le dépôt "${name}" a été mis à jour.`,
      })
      setEditMode(false)
      setCurrentDepot(null)
      setName("")
      setDescription("")
      setActiveTab("list")
      fetchDepots()
    } catch (error) {
      console.error("Error updating depot:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le dépôt.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (depot: Depot) => {
    setDepotToDelete(depot)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!depotToDelete || !depotToDelete.id) return

    setLoading(true)
    try {
      await deleteDepot(depotToDelete.id)
      toast({
        title: "Succès",
        description: `Le dépôt "${depotToDelete.name}" a été supprimé.`,
      })
      fetchDepots()
    } catch (error) {
      console.error("Error deleting depot:", error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le dépôt.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setDepotToDelete(null)
    }
  }
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Produits</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => setIsAddProductOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
          <div className="flex gap-2">
          <ShopifyImportModal />
          <Button variant="outline" onClick={() => setIsDepotSheetOpen(true)}>
          <Warehouse className="mr-2 h-4 w-4" />
          Dépôts
        </Button>
        </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 248</div>
            <p className="text-xs text-muted-foreground">+12 depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure vente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Écouteurs sans fil Pro</div>
            <p className="text-xs text-muted-foreground">1 245 unités vendues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 231,89 €</div>
            <p className="text-xs text-muted-foreground">+20,1% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge bénéficiaire</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42,5%</div>
            <p className="text-xs text-muted-foreground">+1,2% par rapport au mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">Tous les produits</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="draft">Brouillons</TabsTrigger>
            <TabsTrigger value="archived">Archivés</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher des produits..." className="pl-8" />
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <ProductsTable />
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <ProductsTable filterStatus="active" />
        </TabsContent>
        <TabsContent value="draft" className="space-y-4">
          <ProductsTable filterStatus="draft" />
        </TabsContent>
        <TabsContent value="archived" className="space-y-4">
          <ProductsTable filterStatus="archived" />
        </TabsContent>
      </Tabs>

      <ProductEditSheet open={isAddProductOpen} onOpenChange={setIsAddProductOpen} />
    
      {/* Depot Management Sheet */}
      <Sheet open={isDepotSheetOpen} onOpenChange={setIsDepotSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gestion des Dépôts</SheetTitle>
            <SheetDescription>Créez, consultez, modifiez ou supprimez vos dépôts de stockage.</SheetDescription>
          </SheetHeader>

          <div className="py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Liste des dépôts</TabsTrigger>
                <TabsTrigger value="add">{editMode ? "Modifier" : "Ajouter"}</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4 mt-4">
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : depots.length === 0 ? (
                  <div className="text-center py-10">
                    <Warehouse className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg mb-1">Aucun dépôt</h3>
                    <p className="text-muted-foreground">Vous n'avez pas encore créé de dépôt.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab("add")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un dépôt
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("add")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un dépôt
                      </Button>
                    </div>

                    {depots.map((depot) => (
                      <Card key={depot.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg flex items-center">
                                <Warehouse className="mr-2 h-4 w-4 text-muted-foreground" />
                                {depot.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {depot.description || "Aucune description"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Créé le {depot.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(depot)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteClick(depot)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add" className="space-y-4 mt-4">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du dépôt</Label>
                    <Input
                      id="name"
                      placeholder="Dépôt principal"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Description du dépôt..."
                      className="min-h-[100px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    {editMode ? (
                      <>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Annuler
                        </Button>
                        <Button onClick={handleUpdateDepot} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Mise à jour...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Mettre à jour
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAddDepot} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Depot Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le dépôt</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce dépôt ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          {depotToDelete && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription>Vous êtes sur le point de supprimer le dépôt "{depotToDelete.name}".</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
