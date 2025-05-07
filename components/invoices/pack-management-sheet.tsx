"use client"

import { useState } from "react"
import { useAppContext } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Plus, Edit, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { deleteDoc, doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Type pour les variantes génériques dans un pack
export type PackVariant = {
  id: string
  attribute: string
  value: string
  quantity: number
}

// Type pour un pack
export type Pack = {
  id: string
  name: string
  description: string
  variants: PackVariant[]
}

// Type pour les types de variantes disponibles
type VariantType = "size" | "color" | "material" | "style"

interface PackManagementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PackManagementSheet({ open, onOpenChange }: PackManagementSheetProps) {
  const { toast } = useToast()
  const { packs, setPacks } = useAppContext()

  // État pour le pack en cours d'édition
  const [currentPack, setCurrentPack] = useState<Pack | null>(null)
  const [editMode, setEditMode] = useState(false)

  // États pour le formulaire
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")
  const [selectedVariantTypes, setSelectedVariantTypes] = useState<VariantType[]>([])
  const [variantEntries, setVariantEntries] = useState<Record<string, { value: string; quantity: number }[]>>({
    size: [],
    color: [],
    material: [],
    style: [],
  })

  // État pour l'affichage des combinaisons
  const [showCombinations, setShowCombinations] = useState(false)
  const [combinations, setCombinations] = useState<PackVariant[]>([])

  // Réinitialiser le formulaire
  const resetForm = () => {
    setPackName("")
    setPackDescription("")
    setSelectedVariantTypes([])
    setVariantEntries({
      size: [],
      color: [],
      material: [],
      style: [],
    })
    setCurrentPack(null)
    setEditMode(false)
    setShowCombinations(false)
    setCombinations([])
  }

  // Ouvrir le formulaire pour créer un nouveau pack
  const openNewPackForm = () => {
    resetForm()
    setEditMode(false)
  }

  // Ouvrir le formulaire pour éditer un pack existant
  const openEditPackForm = (pack: Pack) => {
    setCurrentPack(pack)
    setPackName(pack.name)
    setPackDescription(pack.description || "")

    // Extraire les types de variantes uniques
    const variantTypes = Array.from(new Set(pack.variants.map((v) => v.attribute.toLowerCase()))) as VariantType[]
    setSelectedVariantTypes(variantTypes)

    // Regrouper les variantes par type
    const entries: Record<string, { value: string; quantity: number }[]> = {
      size: [],
      color: [],
      material: [],
      style: [],
    }

    pack.variants.forEach((variant) => {
      const type = variant.attribute.toLowerCase() as VariantType
      if (!entries[type].some((e) => e.value === variant.value)) {
        entries[type].push({ value: variant.value, quantity: variant.quantity })
      }
    })

    setVariantEntries(entries)
    setEditMode(true)

    // Si le pack a des combinaisons, les afficher
    if (pack.variants.length > 0) {
      setShowCombinations(true)
      setCombinations(pack.variants)
    }
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
    setVariantEntries({
      ...variantEntries,
      [type]: [],
    })
  }

  // Ajouter une entrée de variante
  const addVariantEntry = (type: VariantType) => {
    setVariantEntries({
      ...variantEntries,
      [type]: [...variantEntries[type], { value: "", quantity: 1 }],
    })
  }

  // Mettre à jour une entrée de variante
  const updateVariantEntry = (
    type: VariantType,
    index: number,
    field: "value" | "quantity",
    value: string | number,
  ) => {
    const updatedEntries = [...variantEntries[type]]
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value,
    }

    setVariantEntries({
      ...variantEntries,
      [type]: updatedEntries,
    })
  }

  // Supprimer une entrée de variante
  const removeVariantEntry = (type: VariantType, index: number) => {
    setVariantEntries({
      ...variantEntries,
      [type]: variantEntries[type].filter((_, i) => i !== index),
    })
  }

  // Générer les combinaisons de variantes
  const generateCombinations = () => {
    // Vérifier que tous les types de variantes ont au moins une entrée
    const hasEntries = selectedVariantTypes.every((type) => variantEntries[type].length > 0)

    if (!hasEntries) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins une entrée pour chaque type de variante sélectionné.",
        variant: "destructive",
      })
      return
    }

    // Fonction récursive pour générer toutes les combinaisons possibles
    const generateAllCombinations = (
      types: VariantType[],
      currentIndex: number,
      currentCombination: Record<string, { value: string; quantity: number }> = {},
    ): PackVariant[] => {
      if (currentIndex === types.length) {
        // Convertir la combinaison actuelle en variante de pack
        const variants: PackVariant[] = []

        // Pour chaque type dans la combinaison, créer une variante
        Object.entries(currentCombination).forEach(([type, { value, quantity }]) => {
          variants.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            attribute: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
            value,
            quantity,
          })
        })

        return variants
      }

      const currentType = types[currentIndex]
      const results: PackVariant[] = []

      // Pour chaque valeur possible du type actuel
      variantEntries[currentType].forEach((entry) => {
        // Ajouter cette valeur à la combinaison actuelle
        const newCombination = {
          ...currentCombination,
          [currentType]: entry,
        }

        // Récursivement générer les combinaisons pour les types restants
        const subCombinations = generateAllCombinations(types, currentIndex + 1, newCombination)
        results.push(...subCombinations)
      })

      return results
    }

    // Générer toutes les combinaisons
    const allCombinations = generateAllCombinations(selectedVariantTypes, 0)
    setCombinations(allCombinations)
    setShowCombinations(true)
  }

  // Mettre à jour une combinaison
  const updateCombination = (index: number, field: "quantity", value: number) => {
    const updatedCombinations = [...combinations]
    updatedCombinations[index] = {
      ...updatedCombinations[index],
      [field]: value,
    }
    setCombinations(updatedCombinations)
  }


  // Supprimer un pack
  const deletePack = async (packId: string) => {
    await deleteDoc(doc(db, "packs", packId))
    setPacks(packs.filter((p) => p.id !== packId))
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
    }
    return translations[type] || type
  }



  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestion des Packs</SheetTitle>
          <SheetDescription>Créez et gérez des packs avec différentes combinaisons de variantes.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Liste des packs existants */}
          {!editMode && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Packs existants</h3>
                <Button onClick={openNewPackForm}>
                  <Plus className="mr-2 h-4 w-4" /> Nouveau Pack
                </Button>
              </div>

              {packs.length > 0 ? (
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
                      {packs.map((pack) => (
                        <TableRow key={pack.id}>
                          <TableCell className="font-medium">{pack.name}</TableCell>
                          <TableCell>{pack.description || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(pack.variants.map((v) => v.attribute))).map((attr) => (
                                <Badge key={attr} variant="outline">
                                  {attr}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
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
          {(editMode || !packs.length) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{editMode ? "Modifier le pack" : "Créer un nouveau pack"}</h3>
                {editMode && (
                  <Button variant="outline" onClick={resetForm}>
                    Retour à la liste
                  </Button>
                )}
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
                  <h4 className="font-medium">Types de variantes</h4>

                  <div className="flex flex-wrap gap-2">
                    {["size", "color", "material", "style"].map((type) => (
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

                  {selectedVariantTypes.length > 0 && (
                    <div className="space-y-6">
                      {selectedVariantTypes.map((type) => (
                        <Card key={type}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md">{translateVariantType(type)}</CardTitle>
                            <CardDescription>
                              Définissez les valeurs pour {translateVariantType(type).toLowerCase()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {variantEntries[type].map((entry, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <Input
                                    value={entry.value}
                                    onChange={(e) => updateVariantEntry(type, index, "value", e.target.value)}
                                    placeholder={`Valeur de ${translateVariantType(type).toLowerCase()}`}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    min="1"
                                    value={entry.quantity}
                                    onChange={(e) =>
                                      updateVariantEntry(type, index, "quantity", Number.parseInt(e.target.value) || 1)
                                    }
                                    placeholder="Quantité"
                                    className="w-24"
                                  />
                                  <Button variant="ghost" size="icon" onClick={() => removeVariantEntry(type, index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addVariantEntry(type)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter une valeur
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}

                      <Button onClick={generateCombinations} className="w-full">
                        <Package className="h-4 w-4 mr-2" />
                        Générer les combinaisons
                      </Button>
                    </div>
                  )}
                </div>

                {showCombinations && combinations.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Combinaisons générées</h4>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Combinaison</TableHead>
                            <TableHead className="w-[100px]">Quantité</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {combinations.map((combination, index) => (
                            <TableRow key={index}>
                              <TableCell>{`${combination.attribute}: ${combination.value}`}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={combination.quantity}
                                  onChange={(e) =>
                                    updateCombination(index, "quantity", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          {editMode || !packs.length ? (
            <Button onClick={()=>savePack()}>{editMode ? "Mettre à jour" : "Créer le pack"}</Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
