"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAppContext } from "@/context/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash, Plus, PlusCircle, Users, Package } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PackManagementSheet } from "./pack-management-sheet"

// Type pour les clients
export type Customer = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
}

// Données d'exemple pour les clients
export const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Entreprise ABC",
    contact: "Marie Dupont",
    email: "contact@entreprise-abc.com",
    phone: "01 23 45 67 89",
    address: "123 Rue du Commerce, 75001 Paris",
  },
  {
    id: "cust-2",
    name: "Société XYZ",
    contact: "Pierre Martin",
    email: "info@societe-xyz.com",
    phone: "01 98 76 54 32",
    address: "45 Avenue des Affaires, 69002 Lyon",
  },
  {
    id: "cust-3",
    name: "Boutique Mode",
    contact: "Sophie Durand",
    email: "contact@boutique-mode.com",
    phone: "03 45 67 89 10",
    address: "78 Boulevard de la Mode, 75008 Paris",
  },
]

// Type pour les éléments de la facture
type InvoiceItem = {
  id: string
  productId: string
  productName: string
  variantId: string
  attributes: { type: string; value: string }[]
  quantity: number
  packQuantity: number // Quantité en packs
  packSize: number // Taille du pack
  unitPrice: number
}

// Type pour les variantes en cours d'ajout
type CurrentVariant = {
  id: string
  attributes: Record<string, string>
  quantity: number
  packQuantity: number // Quantité en packs
  packSize: number // Taille du pack
  unitPrice: number
  byPack: boolean // Indique si la quantité est saisie en packs ou en unités
}

interface SalesInvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesInvoiceForm({ open, onOpenChange }: SalesInvoiceFormProps) {
  const { products, packs } = useAppContext()

  // État pour les informations de la facture
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    customer: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  })

  // État pour le client sélectionné
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // État pour la gestion des clients et des packs
  const [isCustomersManagementOpen, setIsCustomersManagementOpen] = useState(false)
  const [isPacksManagementOpen, setIsPacksManagementOpen] = useState(false)

  // État pour les articles de la facture
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])

  // État pour le produit sélectionné
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // État pour les variantes en cours d'ajout
  const [currentVariants, setCurrentVariants] = useState<CurrentVariant[]>([])

  // État pour le mode d'ajout de variantes
  const [variantAddMode, setVariantAddMode] = useState<"manual" | "pack">("manual")

  // État pour le pack sélectionné
  const [selectedPack, setSelectedPack] = useState<any>(null)
  const [packDialogOpen, setPackDialogOpen] = useState(false)

  // État pour les variantes manquantes à compléter
  const [missingVariantTypes, setMissingVariantTypes] = useState<Record<string, string[]>>({})
  const [missingVariantValues, setMissingVariantValues] = useState<Record<string, Record<string, string>>>({})

  // Mettre à jour le produit sélectionné quand l'ID change
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [selectedProductId, products])

  // Ajouter une nouvelle variante vide quand un produit est sélectionné
  useEffect(() => {
    if (selectedProduct && variantAddMode === "manual") {
      addNewVariant()
    } else if (!selectedProduct) {
      setCurrentVariants([])
      setSelectedPack(null)
      setVariantAddMode("manual")
    }
  }, [selectedProduct, variantAddMode])

  // Fonction pour ajouter une nouvelle variante vide
  const addNewVariant = () => {
    if (!selectedProduct) return

    // Trouver la taille de pack par défaut pour ce produit
    const defaultPackSize = selectedProduct.variants[0]?.packSize || 1

    const newVariant: CurrentVariant = {
      id: `temp-${Date.now()}-${currentVariants.length}`,
      attributes: {},
      quantity: 1,
      packQuantity: 1,
      packSize: defaultPackSize,
      unitPrice: 0,
      byPack: false,
    }

    setCurrentVariants([...currentVariants, newVariant])
  }

  // Mettre à jour une variante
  const updateVariant = (variantId: string, field: string, value: string | number | boolean) => {
    setCurrentVariants(
      currentVariants?.map((variant) => {
        if (variant.id === variantId) {
          if (field === "quantity" || field === "packQuantity" || field === "unitPrice" || field === "packSize") {
            // Si on met à jour la quantité en unités, mettre à jour la quantité en packs
            if (field === "quantity") {
              const newQuantity = Number(value)
              const newPackQuantity = Math.ceil(newQuantity / variant.packSize)
              return {
                ...variant,
                [field]: newQuantity,
                packQuantity: newPackQuantity,
              }
            }
            // Si on met à jour la quantité en packs, mettre à jour la quantité en unités
            else if (field === "packQuantity") {
              const newPackQuantity = Number(value)
              const newQuantity = newPackQuantity * variant.packSize
              return {
                ...variant,
                [field]: newPackQuantity,
                quantity: newQuantity,
              }
            }
            // Pour les autres champs numériques
            else {
              return { ...variant, [field]: Number(value) }
            }
          } else if (field === "byPack") {
            return { ...variant, [field]: value as boolean }
          } else {
            // C'est un attribut
            return {
              ...variant,
              attributes: {
                ...variant.attributes,
                [field]: value as string,
              },
            }
          }
        }
        return variant
      }),
    )
  }

  // Supprimer une variante
  const removeVariant = (variantId: string) => {
    setCurrentVariants(currentVariants.filter((v) => v.id !== variantId))
  }

  // Obtenir les valeurs uniques pour un type d'attribut
  const getAttributeValues = (attributeType: string, variantId: string) => {
    if (!selectedProduct) return []

    // Récupérer les attributs déjà sélectionnés pour cette variante
    const currentVariant = currentVariants.find((v) => v.id === variantId)
    if (!currentVariant) return []

    // Filtrer les variantes du produit qui correspondent aux attributs déjà sélectionnés
    const filteredVariants = selectedProduct.variants.filter((variant: any) => {
      return Object.entries(currentVariant.attributes).every(([type, value]) => {
        if (type === attributeType) return true // Ignorer l'attribut en cours
        const attr = variant.attributes.find((a: any) => a.type === type)
        return attr && attr.value === value
      })
    })

    // Extraire les valeurs uniques pour le type d'attribut demandé
    const values = new Set<string>()
    filteredVariants.forEach((variant: any) => {
      const attr = variant.attributes.find((a: any) => a.type === attributeType)
      if (attr) values.add(attr.value)
    })

    return Array.from(values)
  }

  // Trouver la variante correspondante dans le produit
  const findMatchingVariant = (variantId: string) => {
    if (!selectedProduct) return null

    const currentVariant = currentVariants.find((v) => v.id === variantId)
    if (!currentVariant) return null

    // Vérifier si tous les attributs sont sélectionnés
    const allAttributesSelected = selectedProduct.variantTypes.every((type: string) => currentVariant.attributes[type])

    if (!allAttributesSelected) return null

    // Trouver la variante correspondante
    return selectedProduct.variants.find((variant: any) => {
      return (
        variant.attributes.every((attr: any) => {
          return currentVariant.attributes[attr.type] === attr.value
        }) && selectedProduct.variantTypes.length === variant.attributes.length
      )
    })
  }

  // Mettre à jour le prix unitaire et la taille du pack lorsqu'une variante est sélectionnée
  useEffect(() => {
    currentVariants.forEach((currentVariant) => {
      const matchingVariant = findMatchingVariant(currentVariant.id)
      if (matchingVariant) {
        if (currentVariant.unitPrice === 0) {
          updateVariant(currentVariant.id, "unitPrice", matchingVariant.price)
        }
        updateVariant(currentVariant.id, "packSize", matchingVariant.packSize)
      }
    })
  }, [currentVariants, selectedProduct])

  // Mettre à jour les informations de la facture
  const handleInvoiceDataChange = (field: string, value: string) => {
    setInvoiceData({
      ...invoiceData,
      [field]: value,
    })
  }

  // Gérer la sélection d'un client
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setInvoiceData({
      ...invoiceData,
      customer: customer.name,
    })
  }

  // Gérer la sélection d'un pack
  const handleSelectPack = (packId: string) => {
    const pack = packs.find((p) => p.id === packId)
    if (!pack || !selectedProduct) return

    setSelectedPack(pack)

    // Identifier les types de variantes du produit
    const productVariantTypes = selectedProduct.variantTypes || []

    // Identifier les types d'attributs présents dans le pack
    const packAttributeTypes = new Set<string>()
    pack.variants.forEach((variant) => {
      packAttributeTypes.add(variant.attribute)
    })

    // Trouver les types de variantes manquants pour chaque variante du pack
    const missing: Record<string, string[]> = {}
    const missingValues: Record<string, Record<string, string>> = {}

    // Regrouper les variantes du pack par combinaison d'attributs
    const packVariantGroups: Record<string, string[]> = {}

    pack.variants.forEach((variant) => {
      const key = `${variant.attribute}:${variant.value}`
      if (!packVariantGroups[key]) {
        packVariantGroups[key] = []
      }
      packVariantGroups[key].push(variant.id)
    })

    // Pour chaque groupe de variantes, identifier les types manquants
    Object.keys(packVariantGroups).forEach((key) => {
      const variantIds = packVariantGroups[key]
      const missingTypes = productVariantTypes.filter(
        (type) => !pack.variants.some((v) => variantIds.includes(v.id) && v.attribute === type),
      )

      if (missingTypes.length > 0) {
        missing[key] = missingTypes
        missingValues[key] = {}
        missingTypes.forEach((type) => {
          missingValues[key][type] = ""
        })
      }
    })

    setMissingVariantTypes(missing)
    setMissingVariantValues(missingValues)

    // Ouvrir le dialogue pour sélectionner les variantes manquantes
    if (Object.keys(missing).length > 0) {
      setPackDialogOpen(true)
    } else {
      // Si aucune variante manquante, ajouter directement le pack
      addPackToInvoice()
    }
  }

  // Mettre à jour une valeur de variante manquante
  const updateMissingVariantValue = (groupKey: string, type: string, value: string) => {
    setMissingVariantValues({
      ...missingVariantValues,
      [groupKey]: {
        ...missingVariantValues[groupKey],
        [type]: value,
      },
    })
  }

  // Vérifier si toutes les variantes manquantes ont été complétées
  const allMissingValuesSelected = () => {
    return Object.keys(missingVariantTypes).every((groupKey) =>
      missingVariantTypes[groupKey].every((type) => missingVariantValues[groupKey][type]),
    )
  }

  // Ajouter un pack à la facture
  const addPackToInvoice = () => {
    if (!selectedProduct || !selectedPack) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit et un pack.",
        variant: "destructive",
      })
      return
    }

    // Si des variantes manquantes n'ont pas été complétées, ouvrir le dialogue
    if (Object.keys(missingVariantTypes).length > 0 && !allMissingValuesSelected()) {
      setPackDialogOpen(true)
      return
    }

    // Créer des articles pour le produit sélectionné en utilisant les attributs du pack
    const newItems: InvoiceItem[] = []

    // Regrouper les variantes du pack par combinaison d'attributs
    const packVariantGroups: Record<string, any[]> = {}

    selectedPack.variants.forEach((variant: any) => {
      const key = `${variant.attribute}:${variant.value}`
      if (!packVariantGroups[key]) {
        packVariantGroups[key] = []
      }
      packVariantGroups[key].push(variant)
    })

    // Pour chaque groupe de variantes
    Object.keys(packVariantGroups).forEach((groupKey) => {
      const packVariants = packVariantGroups[groupKey]

      // Créer un ensemble complet d'attributs en ajoutant les attributs manquants
      const completeAttributes: { type: string; value: string }[] = packVariants?.map((variant) => ({
        type: variant.attribute,
        value: variant.value,
      }))

      // Ajouter les attributs manquants s'il y en a
      if (missingVariantTypes[groupKey]) {
        missingVariantTypes[groupKey].forEach((type) => {
          completeAttributes.push({
            type,
            value: missingVariantValues[groupKey][type],
          })
        })
      }

      // Trouver la variante correspondante dans le produit
      const matchingVariant = selectedProduct.variants.find((variant: any) => {
        return completeAttributes.every((attr) =>
          variant.attributes.some((varAttr: any) => varAttr.type === attr.type && varAttr.value === attr.value),
        )
      })

      if (matchingVariant) {
        // Déterminer la quantité (pour l'instant, on utilise 1 comme quantité par défaut)
        const quantity = 1
        const packSize = matchingVariant.packSize || 1
        const packQuantity = Math.ceil(quantity / packSize)

        newItems.push({
          id: `item-${Date.now()}-${newItems.length}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          variantId: matchingVariant.id,
          attributes: matchingVariant.attributes,
          quantity: quantity,
          packQuantity: packQuantity,
          packSize: packSize,
          unitPrice: matchingVariant.price,
        })
      }
    })

    if (newItems.length > 0) {
      setInvoiceItems([...invoiceItems, ...newItems])
      setSelectedPack(null)
      setMissingVariantTypes({})
      setMissingVariantValues({})
      setPackDialogOpen(false)

      toast({
        title: "Pack ajouté",
        description: `Le pack a été ajouté à la facture.`,
      })
    } else {
      toast({
        title: "Erreur",
        description: "Aucune variante correspondante n'a été trouvée pour ce produit.",
        variant: "destructive",
      })
    }
  }

  // Ajouter les variantes à la facture
  const addVariantsToInvoice = () => {
    if (!selectedProduct) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit.",
        variant: "destructive",
      })
      return
    }

    const newItems: InvoiceItem[] = []

    for (const currentVariant of currentVariants) {
      const matchingVariant = findMatchingVariant(currentVariant.id)

      if (!matchingVariant) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner tous les attributs pour chaque variante.",
          variant: "destructive",
        })
        return
      }

      if (currentVariant.quantity <= 0) {
        toast({
          title: "Erreur",
          description: "La quantité doit être supérieure à zéro.",
          variant: "destructive",
        })
        return
      }

      newItems.push({
        id: `item-${Date.now()}-${newItems.length}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantId: matchingVariant.id,
        attributes: matchingVariant.attributes,
        quantity: currentVariant.quantity,
        packQuantity: currentVariant.packQuantity,
        packSize: matchingVariant.packSize,
        unitPrice: currentVariant.unitPrice,
      })
    }

    setInvoiceItems([...invoiceItems, ...newItems])
    setSelectedProductId("")
    setCurrentVariants([])
  }

  // Supprimer un article de la facture
  const removeInvoiceItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== itemId))
  }

  // Calculer le total de la facture
  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  }

  // Soumettre la facture
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (invoiceItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un article à la facture.",
        variant: "destructive",
      })
      return
    }

    // Ici, vous enverriez normalement les données à votre API
    console.log("Données de la facture:", {
      ...invoiceData,
      customer: selectedCustomer,
      items: invoiceItems,
      total: calculateTotal(),
    })

    toast({
      title: "Facture créée",
      description: `La facture ${invoiceData.invoiceNumber} a été créée avec succès.`,
    })

    // Réinitialiser le formulaire
    setInvoiceItems([])
    setSelectedProductId("")
    setCurrentVariants([])
    setSelectedCustomer(null)

    // Fermer le formulaire
    onOpenChange(false)
  }

  // Formater l'affichage d'un attribut
  const formatAttributeDisplay = (attr: { type: string; value: string }) => {
    const typeLabels: Record<string, string> = {
      size: "Taille",
      color: "Couleur",
      material: "Matériau",
    }

    return `${typeLabels[attr.type] || attr.type}: ${attr.value}`
  }

  // Obtenir les valeurs possibles pour un type d'attribut du produit
  const getProductAttributeValues = (type: string) => {
    if (!selectedProduct) return []

    const values = new Set<string>()
    selectedProduct.variants.forEach((variant: any) => {
      const attr = variant.attributes.find((a: any) => a.type === type)
      if (attr) values.add(attr.value)
    })

    return Array.from(values)
  }

  // Fonction pour ouvrir la gestion des packs
  const openPacksManagement = () => {
    setIsPacksManagementOpen(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>Nouvelle facture de vente</SheetTitle>
              <SheetDescription>
                Ajoutez les détails de votre facture de vente et les articles concernés.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Informations de la facture */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations de la facture</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Numéro de facture</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) => handleInvoiceDataChange("invoiceNumber", e.target.value)}
                      placeholder="ex: FACT-V-001-2023"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer">Client</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="customer"
                        value={invoiceData.customer}
                        onChange={(e) => handleInvoiceDataChange("customer", e.target.value)}
                        placeholder="Nom du client"
                        required
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={() => setIsCustomersManagementOpen(true)}>
                        <Users className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    </div>
                    {selectedCustomer && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Contact: {selectedCustomer.contact} | Tél: {selectedCustomer.phone}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date de facture</Label>
                    <Input
                      id="date"
                      type="date"
                      value={invoiceData.date}
                      onChange={(e) => handleInvoiceDataChange("date", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Date d'échéance</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => handleInvoiceDataChange("dueDate", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <hr className="border-t border-gray-200" />

              {/* Ajout d'articles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Ajouter des articles</h3>

                {/* Sélection du produit */}
                <div className="space-y-2">
                  <Label htmlFor="product">Produit</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={(value) => {
                      setSelectedProductId(value)
                      setVariantAddMode("manual")
                      setSelectedPack(null)
                      setMissingVariantTypes({})
                      setMissingVariantValues({})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="space-y-4">
                    <div className="flex space-x-2 mb-4">
                      <Button
                        type="button"
                        variant={variantAddMode === "manual" ? "default" : "outline"}
                        onClick={() => setVariantAddMode("manual")}
                        className="flex-1"
                      >
                        Ajouter manuellement
                      </Button>
                      <Button
                        type="button"
                        variant={variantAddMode === "pack" ? "default" : "outline"}
                        onClick={() => setVariantAddMode("pack")}
                        className="flex-1"
                      >
                        Utiliser un pack
                      </Button>
                    </div>

                    {variantAddMode === "manual" ? (
                      <>
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Variantes de {selectedProduct.name}</h4>
                          <Button type="button" variant="outline" size="sm" onClick={addNewVariant}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Ajouter une variante
                          </Button>
                        </div>

                        {currentVariants?.map((variant, index) => {
                          const matchingVariant = findMatchingVariant(variant.id)

                          return (
                            <Card key={variant.id} className="relative">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Variante {index + 1}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                  {selectedProduct.variantTypes?.map((attrType: string) => (
                                    <div key={attrType} className="space-y-2">
                                      <Label htmlFor={`${variant.id}-${attrType}`}>
                                        {attrType === "size"
                                          ? "Taille"
                                          : attrType === "color"
                                            ? "Couleur"
                                            : attrType === "material"
                                              ? "Matériau"
                                              : attrType}
                                      </Label>
                                      <Select
                                        value={variant.attributes[attrType] || ""}
                                        onValueChange={(value) => updateVariant(variant.id, attrType, value)}
                                      >
                                        <SelectTrigger id={`${variant.id}-${attrType}`}>
                                          <SelectValue
                                            placeholder={`Sélectionner ${
                                              attrType === "size"
                                                ? "une taille"
                                                : attrType === "color"
                                                  ? "une couleur"
                                                  : attrType === "material"
                                                    ? "un matériau"
                                                    : attrType
                                            }`}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {getAttributeValues(attrType, variant.id)?.map((value) => (
                                            <SelectItem key={value} value={value}>
                                              {value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ))}

                                  <div className="space-y-2">
                                    <Label htmlFor={`${variant.id}-quantity-type`}>Type de quantité</Label>
                                    <Select
                                      value={variant.byPack ? "pack" : "unit"}
                                      onValueChange={(value) => updateVariant(variant.id, "byPack", value === "pack")}
                                    >
                                      <SelectTrigger id={`${variant.id}-quantity-type`}>
                                        <SelectValue placeholder="Sélectionner le type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unit">Unités</SelectItem>
                                        <SelectItem value="pack">Packs</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`${variant.id}-quantity`}>
                                      {variant.byPack ? "Quantité (packs)" : "Quantité (unités)"}
                                    </Label>
                                    <Input
                                      id={`${variant.id}-quantity`}
                                      type="number"
                                      min="1"
                                      value={variant.byPack ? variant.packQuantity : variant.quantity}
                                      onChange={(e) => {
                                        const value = Number.parseInt(e.target.value) || 1
                                        updateVariant(variant.id, variant.byPack ? "packQuantity" : "quantity", value)
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`${variant.id}-price`}>Prix unitaire (€)</Label>
                                    <Input
                                      id={`${variant.id}-price`}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={variant.unitPrice}
                                      onChange={(e) =>
                                        updateVariant(variant.id, "unitPrice", Number.parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </div>
                                </div>

                                {matchingVariant && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      Stock: {matchingVariant.stock} unités
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      Taille de pack: {matchingVariant.packSize} unités
                                    </Badge>
                                    {variant.byPack ? (
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                        Total: {variant.quantity} unités ({variant.packQuantity} packs)
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                        Total: {variant.quantity} unités ({variant.packQuantity} packs)
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {currentVariants.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => removeVariant(variant.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}

                        {currentVariants.length > 0 && (
                          <div className="flex justify-end">
                            <Button type="button" onClick={addVariantsToInvoice}>
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter à la facture
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Sélectionner un pack pour {selectedProduct.name}</h4>
                          <Button type="button" variant="outline" onClick={openPacksManagement}>
                            <Package className="h-4 w-4 mr-2" />
                            Gérer les packs
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="pack-select">Pack</Label>
                            <Select value={selectedPack?.id || ""} onValueChange={handleSelectPack}>
                              <SelectTrigger id="pack-select">
                                <SelectValue placeholder="Sélectionner un pack" />
                              </SelectTrigger>
                              <SelectContent>
                                {packs?.map((pack) => (
                                  <SelectItem key={pack.id} value={pack.id}>
                                    {pack.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr className="border-t border-gray-200" />

              {/* Liste des articles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Articles de la facture</h3>
                {invoiceItems.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Variante</TableHead>
                          <TableHead>Quantité</TableHead>
                          <TableHead>Prix unitaire</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {item.attributes?.map((attr, i) => (
                                  <Badge key={i} variant="outline">
                                    {formatAttributeDisplay(attr)}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.quantity} ({item.packQuantity} packs)
                            </TableCell>
                            <TableCell>{item.unitPrice.toFixed(2)} €</TableCell>
                            <TableCell>{(item.quantity * item.unitPrice).toFixed(2)} €</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInvoiceItem(item.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-medium">
                            Total
                          </TableCell>
                          <TableCell className="font-bold">{calculateTotal().toFixed(2)} €</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    Aucun article ajouté à la facture
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={invoiceData.notes}
                  onChange={(e) => handleInvoiceDataChange("notes", e.target.value)}
                  placeholder="Notes ou commentaires sur la facture"
                  rows={3}
                />
              </div>
            </div>

            <SheetFooter>
              <Button type="submit" disabled={invoiceItems.length === 0}>
                Créer la facture
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Dialogue pour compléter les variantes manquantes d'un pack */}
      <Dialog open={packDialogOpen} onOpenChange={setPackDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Compléter les variantes manquantes</DialogTitle>
            <DialogDescription>
              Certaines variantes du pack nécessitent des informations supplémentaires pour ce produit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {Object.keys(missingVariantTypes)?.map((groupKey) => {
              const [attribute, value] = groupKey.split(":")
              return (
                <div key={groupKey} className="space-y-4">
                  <h4 className="font-medium">
                    Pour {attribute}: {value}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {missingVariantTypes[groupKey]?.map((type) => (
                      <div key={type} className="space-y-2">
                        <Label htmlFor={`missing-${groupKey}-${type}`}>
                          {type === "size"
                            ? "Taille"
                            : type === "color"
                              ? "Couleur"
                              : type === "material"
                                ? "Matériau"
                                : type}
                        </Label>
                        <Select
                          value={missingVariantValues[groupKey]?.[type] || ""}
                          onValueChange={(value) => updateMissingVariantValue(groupKey, type, value)}
                        >
                          <SelectTrigger id={`missing-${groupKey}-${type}`}>
                            <SelectValue placeholder={`Sélectionner ${type}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {getProductAttributeValues(type)?.map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPackDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addPackToInvoice} disabled={!allMissingValuesSelected()}>
              Ajouter à la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet pour la gestion des packs */}
      <PackManagementSheet open={isPacksManagementOpen} onOpenChange={setIsPacksManagementOpen} />
    </>
  )
}
