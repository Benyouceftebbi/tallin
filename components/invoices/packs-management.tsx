"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useAppContext } from "@/context/app-context"
import { Trash2, Plus, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Type pour une variante dans un pack (nouveau format)
export type PackVariant = {
  id: string
  [key: string]: string | number // Pour permettre des attributs dynamiques comme size, color, etc.
}

// Type pour un pack
export type Pack = {
  id: string
  name: string
  description?: string
  variants: PackVariant[]
}

// Type pour les types de variantes disponibles
type VariantType = "size" | "color" | "material" | "style"

// Valeurs prédéfinies pour chaque type de variante
const presetValues: Record<VariantType, string[]> = {
  size: ["XS", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  color: ["Noir", "Blanc", "Rouge", "Bleu", "Vert", "Jaune", "Orange", "Violet", "Rose", "Gris", "Marron", "Beige"],
  material: ["Coton", "Polyester", "Laine", "Soie", "Lin", "Cuir", "Daim", "Denim", "Velours", "Nylon"],
  style: ["Casual", "Formel", "Sport", "Vintage", "Moderne", "Classique", "Élégant", "Bohème", "Minimaliste"],
}

// Props pour le composant PacksManagement
export type PacksManagementProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  selectable?: boolean
  onSelectPack?: (pack: Pack) => void
}

// Composant principal
export function PacksManagement({
  open: externalOpen,
  onOpenChange,
  selectable = false,
  onSelectPack,
}: PacksManagementProps = {}) {
  const { toast } = useToast()
  const appContext = useAppContext()
  const packs = appContext?.packs || []
  const setPacks = appContext?.setPacks

  // État pour l'ouverture du composant
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  // État pour le pack en cours d'édition
  const [currentPack, setCurrentPack] = useState<Pack | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // États pour le formulaire
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<VariantType[]>([])

  // État pour les combinaisons
  const [combinations, setCombinations] = useState<PackVariant[]>([])

  // État pour la nouvelle combinaison en cours d'édition
  const [newCombination, setNewCombination] = useState<Record<string, string | number>>({
    unity: 1,
  })

  // Réinitialiser le formulaire
  const resetForm = () => {
    setPackName("")
    setPackDescription("")
    setSelectedVariantTypes([])
    setCurrentPack(null)
    setEditMode(false)
    setCombinations([])
    setNewCombination({ unity: 1 })
    setShowForm(false)
  }

  // Ouvrir le formulaire pour créer un nouveau pack
  const openNewPackForm = () => {
    resetForm()
    setEditMode(false)
    setShowForm(true)
  }

  // Ouvrir le formulaire pour éditer un pack existant
  const openEditPackForm = (pack: Pack) => {
    setCurrentPack(pack)
    setPackName(pack.name)
    setPackDescription(pack.description || "")

    // Extraire les types de variantes uniques
    const variantTypes = new Set<VariantType>()
    pack.variants.forEach((variant) => {
      Object.keys(variant).forEach((key) => {
        if (key !== "id" && key !== "unity") {
          variantTypes.add(key as VariantType)
        }
      })
    })

    setSelectedVariantTypes(Array.from(variantTypes) as VariantType[])
    setCombinations(pack.variants)
    setEditMode(true)
    setShowForm(true)
  }

  // Ajouter un type de variante
  const addVariantType = (type: VariantType) => {
    if (!selectedVariantTypes.includes(type)) {
      setSelectedVariantTypes([...selectedVariantTypes, type])
    }
  }

  // Supprimer un type de variante
  const removeVariantType = (type: VariantType) => {
    setSelectedVariantTypes(selectedVariantTypes.filter((t) => t !== type))

    // Supprimer ce type de toutes les combinaisons
    setCombinations(
      combinations?.map((combo) => {
        const newCombo = { ...combo }
        delete newCombo[type]
        return newCombo
      }),
    )

    // Supprimer du nouveau combo en cours d'édition
    const updatedNewCombination = { ...newCombination }
    delete updatedNewCombination[type]
    setNewCombination(updatedNewCombination)
  }

  // Mettre à jour la valeur d'un attribut dans la nouvelle combinaison
  const updateNewCombinationValue = (attribute: string, value: string | number) => {
    setNewCombination({
      ...newCombination,
      [attribute]: value,
    })
  }

  // Ajouter une nouvelle combinaison
  const addNewCombination = () => {
    // Vérifier que tous les types sélectionnés ont une valeur
    const hasAllValues = selectedVariantTypes.every((type) => newCombination[type] !== undefined)

    if (!hasAllValues) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une valeur pour chaque type de variante.",
        variant: "destructive",
      })
      return
    }

    if (!newCombination.unity || Number(newCombination.unity) <= 0) {
      toast({
        title: "Erreur",
        description: "La quantité doit être supérieure à zéro.",
        variant: "destructive",
      })
      return
    }

    // Ajouter la combinaison à la liste
    const newCombo: PackVariant = {
      id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...newCombination,
    }

    setCombinations([...combinations, newCombo])

    // Réinitialiser le formulaire de nouvelle combinaison
    setNewCombination({ unity: 1 })

    toast({
      title: "Succès",
      description: "Combinaison ajoutée avec succès.",
    })
  }

  // Supprimer une combinaison
  const removeCombination = (comboId: string) => {
    setCombinations(combinations.filter((c) => c.id !== comboId))
  }

  // Mettre à jour une combinaison existante
  const updateCombination = (comboId: string, attribute: string, value: string | number) => {
    setCombinations(
      combinations?.map((combo) => {
        if (combo.id === comboId) {
          return {
            ...combo,
            [attribute]: value,
          }
        }
        return combo
      }),
    )
  }

  // Sauvegarder le pack
  const savePack = () => {
    if (!packName) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom au pack",
        variant: "destructive",
      })
      return
    }

    if (combinations.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins une combinaison de variantes",
        variant: "destructive",
      })
      return
    }

    const packToSave: Pack = {
      id: editMode && currentPack ? currentPack.id : `pack-${Date.now()}`,
      name: packName,
      description: packDescription,
      variants: combinations,
    }

    if (editMode && currentPack) {
      // Mettre à jour un pack existant
      if (setPacks) {
        setPacks(packs?.map((p) => (p.id === currentPack.id ? packToSave : p)))
      }
      toast({
        title: "Succès",
        description: "Pack mis à jour avec succès",
      })
    } else {
      // Créer un nouveau pack
      if (setPacks) {
        setPacks([...packs, packToSave])
      }
      toast({
        title: "Succès",
        description: "Nouveau pack créé avec succès",
      })
    }

    // Réinitialiser le formulaire et fermer la side sheet
    resetForm()
  }

  // Supprimer un pack
  const deletePack = (packId: string) => {
    if (setPacks) {
      setPacks(packs.filter((p) => p.id !== packId))
    }
    toast({
      title: "Succès",
      description: "Pack supprimé avec succès",
    })
  }

  // Traduire le type de variante en français
  const translateVariantType = (type: string): string => {
    const translations: Record<string, string> = {
      size: "Taille",
      color: "Couleur",
      material: "Matériau",
      style: "Style",
      unity: "Quantité",
    }
    return translations[type] || type
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestion des Packs</SheetTitle>
          <SheetDescription>Créez et gérez des packs avec différentes combinaisons de variantes.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Liste des packs existants */}
          {!showForm && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Packs existants</h3>
                <Button onClick={openNewPackForm}>
                  <Plus className="mr-2 h-4 w-4" /> Nouveau Pack
                </Button>
              </div>

              {packs && packs.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Variantes</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packs?.map((pack) => (
                        <TableRow key={pack.id}>
                          <TableCell className="font-medium">{pack.name}</TableCell>
                          <TableCell>{pack.description || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {pack.variants &&
                                pack.variants.length > 0 &&
                                Array.from(
                                  new Set(
                                    pack.variants.flatMap((v) =>
                                      Object.keys(v).filter((k) => k !== "id" && k !== "unity"),
                                    ),
                                  ),
                                )?.map((attr) => (
                                  <Badge key={attr} variant="outline">
                                    {translateVariantType(attr)}
                                  </Badge>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {selectable && onSelectPack && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    onSelectPack(pack)
                                    setOpen(false)
                                  }}
                                >
                                  Sélectionner
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => openEditPackForm(pack)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePack(pack.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border rounded-md">
                  Aucun pack défini. Créez votre premier pack.
                </div>
              )}
            </div>
          )}

          {/* Formulaire de création/édition de pack */}
          {showForm && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{editMode ? "Modifier le pack" : "Créer un nouveau pack"}</h3>
                <Button variant="outline" onClick={resetForm}>
                  Retour à la liste
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="packName">Nom du pack</Label>
                    <Input
                      id="packName"
                      value={packName}
                      onChange={(e) => setPackName(e.target.value)}
                      placeholder="Ex: Pack Standard, Pack Premium..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packDescription">Description</Label>
                    <Textarea
                      id="packDescription"
                      value={packDescription}
                      onChange={(e) => setPackDescription(e.target.value)}
                      placeholder="Description détaillée du pack..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Types de variantes</h4>
                    <div className="flex flex-wrap gap-2">
                      {["size", "color", "material", "style"]?.map((type) => (
                        <Badge
                          key={type}
                          variant={selectedVariantTypes.includes(type as VariantType) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedVariantTypes.includes(type as VariantType)) {
                              removeVariantType(type as VariantType)
                            } else {
                              addVariantType(type as VariantType)
                            }
                          }}
                        >
                          {translateVariantType(type)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Formulaire d'ajout de combinaison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ajouter une combinaison</CardTitle>
                      <CardDescription>
                        Créez une combinaison spécifique avec les attributs sélectionnés
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="unity">Quantité</Label>
                          <Input
                            id="unity"
                            type="number"
                            min="1"
                            value={newCombination.unity as number}
                            onChange={(e) => updateNewCombinationValue("unity", Number.parseInt(e.target.value) || 1)}
                          />
                        </div>

                        {selectedVariantTypes?.map((type) => (
                          <div key={type} className="space-y-2">
                            <Label htmlFor={`new-${type}`}>{translateVariantType(type)}</Label>
                            <Select
                              value={(newCombination[type] as string) || ""}
                              onValueChange={(value) => updateNewCombinationValue(type, value)}
                            >
                              <SelectTrigger id={`new-${type}`}>
                                <SelectValue placeholder={`Sélectionner ${translateVariantType(type).toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {presetValues[type]?.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={addNewCombination} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter cette combinaison
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Liste des combinaisons */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Combinaisons ({combinations.length})</h4>
                    {combinations.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quantité</TableHead>
                              {selectedVariantTypes?.map((type) => (
                                <TableHead key={type}>{translateVariantType(type)}</TableHead>
                              ))}
                              <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {combinations?.map((combo) => (
                              <TableRow key={combo.id}>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={combo.unity as number}
                                    onChange={(e) =>
                                      updateCombination(combo.id, "unity", Number.parseInt(e.target.value) || 1)
                                    }
                                    className="w-20"
                                  />
                                </TableCell>
                                {selectedVariantTypes?.map((type) => (
                                  <TableCell key={type}>{combo[type] || "-"}</TableCell>
                                ))}
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => removeCombination(combo.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground border rounded-md">
                        Aucune combinaison ajoutée. Ajoutez des combinaisons à l'aide du formulaire ci-dessus.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={savePack} className="w-full">
                    {editMode ? "Mettre à jour le pack" : "Créer le pack"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
