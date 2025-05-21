"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, Plus, Save, PlusCircle, Users, Package, Edit } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SuppliersManagement, type Supplier } from "./suppliers-management"
import { PacksManagement, type Pack } from "./packs-management"
import { DepotsManagement, type Depot } from "./depots-management"
import { useAppContext } from "@/context/app-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useShop } from "@/context/shop-context"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Types pour les produits et leurs variantes
type VariantAttribute = {
  type: string // "size", "color", etc.
  value: string
}

type ProductVariant = {
  id: string
  attributes: VariantAttribute[]
  price: number
  stock: number
  packSize: number // Taille du pack pour cette variante
}

// Simplified ProductDepot type
type ProductDepot = {
  id: string
  name: string
  priority: "principale" | "secondaire" | "tertiaire"
  quantity: number
}

type Product = {
  id: string
  name: string
  title?: string
  sku: string
  category: string
  variantTypes: string[] // Les types de variantes que ce produit possède (ex: ["size", "color"])
  variants: ProductVariant[]
  options?: any[]
  depots?: ProductDepot[] // Add depots to the Product type
}

// Type pour les éléments de la facture
type InvoiceItem = {
  id: string
  productId: string
  productName: string
  variantId: string
  attributes: VariantAttribute[] | string
  quantity: number
  packQuantity: number // Quantité en packs
  packSize: number // Taille du pack
  unitPrice: number
  depot: string // Add this field for depot selection
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
  isPackSelection: boolean // Indique si on utilise un pack prédéfini
  selectedPackId?: string // ID du pack sélectionné si isPackSelection est true
  // depot field removed from here
}

interface PurchaseInvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
  isEditing?: boolean
}

export function PurchaseInvoiceForm({
  open,
  onOpenChange,
  initialData = null,
  isEditing = false,
}: PurchaseInvoiceFormProps) {
  const { products } = useAppContext()
   const { addInvoice, updateInvoice, invoices } = useShop()


  // État pour les informations de la facture
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    status: "pending" as "pending" | "paid" | "overdue",
  })

  // État pour le fournisseur sélectionné
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // État pour la gestion des fournisseurs, des packs et des dépôts
  const [isSuppliersManagementOpen, setIsSuppliersManagementOpen] = useState(false)
  const [isPacksManagementOpen, setIsPacksManagementOpen] = useState(false)
  const [isDepotsManagementOpen, setIsDepotsManagementOpen] = useState(false)

  // État pour les articles de la facture
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])

  //l État pour le produit sélectionné
  const [selectedProductId, setSelectedProductId] = useState("")

  // État pour les variantes en cours d'ajout
  const [currentVariants, setCurrentVariants] = useState<CurrentVariant[]>([])

  // État pour l'onglet actif
  const [activeTab, setActiveTab] = useState<"product" | "pack">("product")

  // État pour l'onglet actif dans la section produit
  const [productEntryMode, setProductEntryMode] = useState<"manual" | "pack">("manual")

  // Add this near the other state declarations
  const [selectedDepot, setSelectedDepot] = useState<string>("")

  // Add a new state for the invoice-level depot selection
  const [invoiceDepot, setInvoiceDepot] = useState<string>("")
  const [allDepots, setAllDepots] = useState<ProductDepot[]>([])

  const appContext = useAppContext()
  const packs = appContext?.packs || []

  // Obtenir le produit sélectionné
  const selectedProduct = useMemo(() => {
    return products?.find((p) => p.id === selectedProductId)
  }, [selectedProductId, products])

  // Get product depots
  const productDepots = useMemo(() => {
    return selectedProduct?.depots || []
  }, [selectedProduct])

  // Filtrer les packs qui correspondent au produit sélectionné
  const filteredPacks = packs
const generateNextInvoiceNumber = () => {
    // Get all existing invoice numbers
    const existingNumbers = invoices
      .map((inv) => {
        // Extract the numeric part from invoice numbers that match the format "FACTURE-XXXXX"
        const match = inv.invoiceNumber.match(/FACTURE-(\d+)/)
        return match ? Number.parseInt(match[1], 10) : 0
      })
      .filter((num) => !isNaN(num))

    // Find the highest number
    const highestNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0

    // Generate the next number with leading zeros (5 digits)
    const nextNumber = (highestNumber + 1).toString().padStart(5, "0")

    return `FACTURE-${nextNumber}`
  }
    // Auto-generate invoice number when form opens
  useEffect(() => {
    if (open && !isEditing) {
      const nextInvoiceNumber = generateNextInvoiceNumber()
      setInvoiceData((prev) => ({
        ...prev,
        invoiceNumber: nextInvoiceNumber,
      }))
    }
  }, [open, isEditing, invoices])
  // Initialize form with data when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setInvoiceData({
        invoiceNumber: initialData.invoiceNumber || "",
        supplier: initialData.supplier?.name || "",
        date: initialData.date || new Date().toISOString().split("T")[0],
        dueDate: initialData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        notes: initialData.notes || "",
        status: initialData.status || "pending",
      })

      setSelectedSupplier(initialData.supplier || null)

      if (initialData.items && Array.isArray(initialData.items)) {
        setInvoiceItems(initialData.items)
      }
    }
  }, [initialData, isEditing])

  // Update when product changes to also update available depots
  useEffect(() => {
    if (selectedProduct) {
      if (productEntryMode === "manual" && currentVariants.length === 0) {
        addNewVariant()
      }

      // Get the product-specific depots
      if (productDepots.length > 0) {
        // Set the default depot to the main depot if available
        const mainDepot = productDepots.find((d) => d.priority === "principale")
        setSelectedDepot(mainDepot?.id || productDepots[0]?.id || "")

        // Show a message about product-specific depots
        toast({
          title: "Dépôts spécifiques au produit",
          description: `${productDepots.length} dépôt(s) disponible(s) pour ${selectedProduct.title || selectedProduct.name}`,
        })
      } else {
        // If no product-specific depots, show a warning
        toast({
          title: "Attention",
          description: `Aucun dépôt n'est configuré pour ${selectedProduct.title || selectedProduct.name}`,
          variant: "destructive",
        })
        setSelectedDepot("")
      }
    } else {
      setCurrentVariants([])
      setSelectedDepot("")
    }
  }, [selectedProduct, productEntryMode, currentVariants.length, productDepots])


 useEffect(() => {
    const fetchDepots = async () => {
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

        setAllDepots(depotsList)
      } catch (error) {
        console.error("Error fetching depots:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les dépôts depuis la base de données.",
          variant: "destructive",
        })

        // Fallback to default depots if Firebase fetch fails
        setAllDepots([
          { id: "depot1", name: "Dépôt Principal", priority: "principale", type: "principale", quantity: 120 },
          { id: "depot2", name: "Dépôt Secondaire", priority: "secondaire", type: "principale", quantity: 85 },
          { id: "depot3", name: "Dépôt Tertiaire", priority: "tertiaire", type: "principale", quantity: 50 },
          { id: "depot4", name: "Dépôt Express", priority: "principale", type: "principale", quantity: 30 },
          { id: "depot5", name: "Dépôt Réserve", priority: "tertiaire", type: "principale", quantity: 200 },
        ])
      }
    }

    fetchDepots()
  }, [])
  // Fonction pour ajouter une nouvelle variante vide
  const addNewVariant = () => {
    if (!selectedProduct) return

    // Trouver la taille de pack par défaut pour ce produit
    const defaultPackSize = selectedProduct.variants[0]?.packSize || 1
   const firstVariantPrice = currentVariants[0]?.unitPrice || selectedProduct.variants[0]?.price
    const newVariant: CurrentVariant = {
      id: `temp-${Date.now()}-${currentVariants.length}`,
      attributes: {},
      quantity: 1,
      packQuantity: 1,
      packSize: defaultPackSize,
      unitPrice: Number(firstVariantPrice),
      byPack: false,
      isPackSelection: false,
      // depot field removed from here
    }

    setCurrentVariants([...currentVariants, newVariant])
  }

  // Fonction pour appliquer un pack au produit sélectionné
  const applyPackToProduct = (pack: Pack) => {
    if (!selectedProduct) return
    if (!pack.variants || pack.variants.length === 0) {
      toast({
        title: "Erreur",
        description: "Ce pack ne contient aucune variante.",
        variant: "destructive",
      })
      return
    }

    // Créer des variantes à partir des variantes du pack
    const newVariants: CurrentVariant[] = []
    pack.variants.forEach((variant, index) => {
      const matchingOption = selectedProduct.options?.find((option) => option.values.includes(variant.size))

      if (matchingOption) {
        const attributes: Record<string, string> = {
          [matchingOption.name]: variant.size,
        }

        newVariants.push({
          id: `temp-${Date.now()}-${index}`,
          attributes,
          quantity: Number(variant.unity || 1),
          packQuantity: Math.ceil(Number(variant.unity || 1) / pack.variants.length),
          packSize: pack.variants.length,
          unitPrice: Number(selectedProduct.variants[0]?.price),
          byPack: false,
          isPackSelection: false,
          // Remove depot field
        })
      }
    })

    if (newVariants.length === 0) {
      toast({
        title: "Attention",
        description: "Aucune variante du pack ne correspond aux variantes du produit.",
        variant: "destructive",
      })
      return
    }

    setCurrentVariants(newVariants)
    setProductEntryMode("manual") // Basculer en mode manuel pour permettre l'édition

    toast({
      title: "Pack appliqué",
      description: `Le pack "${pack.name}" a été appliqué au produit. Vous pouvez maintenant modifier les variantes.`,
    })
  }

  // Fonction pour ajouter directement un pack à la facture
  const addPackDirectlyToInvoice = (pack: Pack) => {
    if (!selectedProduct) return
    if (!pack.variants || pack.variants.length === 0) {
      toast({
        title: "Erreur",
        description: "Ce pack ne contient aucune variante.",
        variant: "destructive",
      })
      return
    }

    const newItems: InvoiceItem[] = []

    // Pour chaque variante du produit, vérifier si elle correspond aux attributs du pack
    selectedProduct.variants.forEach((productVariant) => {
      // Vérifier si cette variante correspond aux attributs du pack
      const matchingPackVariant = pack.variants.find((packVar) => {
        return productVariant.attributes.some((attr) => {
          const attrType = attr.type
          return packVar[attrType] !== undefined && packVar[attrType] === attr.value
        })
      })

      if (matchingPackVariant) {
        newItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: selectedProduct.id,
          productName: selectedProduct.title || selectedProduct.name,
          variantId: productVariant.id,
          attributes: productVariant.attributes,
          quantity: Number(matchingPackVariant.unity || 1),
          packQuantity: Math.ceil(Number(matchingPackVariant.unity || 1) / productVariant.packSize),
          packSize: productVariant.packSize,
          unitPrice: productVariant.price,
          depot: selectedDepot, // Use selectedDepot instead of depots[0]?.id
        })
      }
    })

    if (newItems.length === 0) {
      toast({
        title: "Attention",
        description: "Aucune variante du pack ne correspond aux variantes du produit.",
        variant: "destructive",
      })
      return
    }

    setInvoiceItems([...invoiceItems, ...newItems])
    setSelectedProductId("")
    setCurrentVariants([])

    toast({
      title: "Pack ajouté",
      description: `Le pack "${pack.name}" a été ajouté à la facture.`,
    })
  }

  // Add a function to handle pack selection for a variant
  const handlePackSelection = (variantId: string, packId: string, pack: Pack) => {
    setCurrentVariants(
      currentVariants?.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            selectedPackId: packId,
            // Reset attributes as they'll come from the pack
            attributes: {},
          }
        }
        return variant
      }),
    )

    // You might want to update other fields based on the selected pack
    toast({
      title: "Pack sélectionné",
      description: `Le pack "${pack.name}" a été sélectionné pour cette variante.`,
    })
  }

  const updateVariant = (variantId: string, field: string, value: string | number | boolean) => {
    setCurrentVariants((prevVariants) => {
      if (!prevVariants) return []

      const isFirstVariant = prevVariants[0]?.id === variantId
      const isGlobalUpdate = isFirstVariant && typeof value === "string" && value.length > 3

      return prevVariants.map((variant) => {
        const shouldUpdate = field === "unitPrice" || isGlobalUpdate || variant.id === variantId

        if (!shouldUpdate) return variant

        let updatedPrice = variant.unitPrice

        const selectedOptions = selectedProduct?.options?.map((opt) => opt.name) || []
        const matchingVariant = selectedProduct?.variants.find((v) => {
          return selectedOptions.every((name, index) => {
            const selectedValue = variant.attributes[name]
            const variantOption = v[`option${index + 1}`]
            return selectedValue === variantOption
          })
        })

        if (matchingVariant) {
          updatedPrice = matchingVariant.price
        }

        if (field === "quantity") {
          const newQuantity = Number(value)
          const newPackQuantity = Math.ceil(newQuantity / variant.packSize)
          return {
            ...variant,
            quantity: newQuantity,
            packQuantity: newPackQuantity,
          }
        } else if (field === "packQuantity") {
          const newPackQuantity = Number(value)
          const newQuantity = newPackQuantity * variant.packSize
          return {
            ...variant,
            packQuantity: newPackQuantity,
            quantity: newQuantity,
          }
        } else if (field === "unitPrice" || field === "packSize") {
          return {
            ...variant,
            [field]: Number(value),
          }
        } else if (field === "byPack") {
          return {
            ...variant,
            byPack: value as boolean,
          }
        } else {
          return {
            ...variant,
            attributes: {
              ...variant.attributes,
              [field]: value as string,
            },
            unitPrice: Number(updatedPrice),
          }
        }
      })
    })
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
    const filteredVariants = selectedProduct.variants.filter((variant) => {
      return Object.entries(currentVariant.attributes).every(([type, value]) => {
        if (type === attributeType) return true // Ignorer l'attribut en cours
        const attr = variant.attributes.find((a) => a.type === type)
        return attr && attr.value === value
      })
    })

    // Extraire les valeurs uniques pour le type d'attribut demandé
    const values = new Set<string>()
    filteredVariants.forEach((variant) => {
      const attr = variant.attributes.find((a) => a.type === attributeType)
      if (attr) values.add(attr.value)
    })

    return Array.from(values)
  }

  const findMatchingVariant = (variantId: string) => {
    if (!selectedProduct) return null

    const currentVariant = currentVariants.find((v) => v.id === variantId)
    if (!currentVariant) return null

    // Vérifier si tous les attributs sont sélectionnés
    const allAttributesSelected = selectedProduct.options?.every((type) => currentVariant.attributes[type.name])

    if (!allAttributesSelected) return null

    // Trouver la variante correspondante
    return selectedProduct.variants.find((variant) => {
      return selectedProduct.options?.every((option, index) => {
        const selectedValue = currentVariant.attributes[option.name]
        const variantOption = variant[`option${index + 1}`] // "option1", "option2", ...
        return selectedValue === variantOption
      })
    })
  }

  // Mettre à jour les informations de la facture
  const handleInvoiceDataChange = (field: string, value: string) => {
    setInvoiceData({
      ...invoiceData,
      [field]: value,
    })
  }

  // Gérer la sélection d'un fournisseur
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setInvoiceData({
      ...invoiceData,
      supplier: supplier.name,
    })
  }

  // Gérer la sélection d'un pack
  const handleSelectPack = (pack: Pack) => {
    if (!selectedProduct) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sélectionner un produit.",
        variant: "destructive",
      })
      return
    }

    // Apply the pack to the current product
    if (pack.variants && pack.variants.length > 0) {
      applyPackToProduct(pack)
    } else {
      toast({
        title: "Erreur",
        description: "Ce pack ne contient aucune variante.",
        variant: "destructive",
      })
      return
    }
  }

  // Gérer la sélection d'un dépôt
  const handleSelectDepot = (depot: Depot) => {
    // Update both depot states
    setSelectedDepot(depot.id)
    setInvoiceDepot(depot.id)

    toast({
      title: "Dépôt sélectionné",
      description: `Le dépôt "${depot.name}" a été sélectionné pour cette facture.`,
    })
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

    if (!invoiceDepot) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un dépôt pour cette facture.",
        variant: "destructive",
      })
      return
    }

    const newItems: InvoiceItem[] = []

    for (const currentVariant of currentVariants) {
      // Handle pack selection
      if (currentVariant.isPackSelection && currentVariant.selectedPackId) {
        const selectedPack = packs?.find((p) => p.id === currentVariant.selectedPackId)

        if (!selectedPack || !selectedPack.variants || selectedPack.variants.length === 0) {
          toast({
            title: "Erreur",
            description: "Pack sélectionné introuvable ou invalide.",
            variant: "destructive",
          })
          return
        }

        // For each variant in the pack, create an invoice item
        for (const packVariant of selectedPack.variants) {
          // Find the matching product variant
          const matchingVariant = selectedProduct.variants.find((variant) => {
            return variant.attributes.some((attr) => {
              return packVariant[attr.type] !== undefined && packVariant[attr.type] === attr.value
            })
          })

          if (!matchingVariant) {
            toast({
              title: "Attention",
              description: `Certaines variantes du pack ne correspondent pas aux variantes du produit.`,
              variant: "destructive",
            })
            continue
          }

          // Calculate quantities
          const baseQuantity =
            Number(packVariant.unity || 1) * (currentVariant.byPack ? currentVariant.packQuantity : 1)

          newItems.push({
            id: `item-${Date.now()}-${newItems.length}`,
            productId: selectedProduct.id,
            productName: selectedProduct.title || selectedProduct.name,
            variantId: matchingVariant.id,
            attributes: matchingVariant.attributes,
            quantity: baseQuantity,
            packQuantity: Math.ceil(baseQuantity / matchingVariant.packSize),
            packSize: matchingVariant.packSize,
            unitPrice: currentVariant.unitPrice || matchingVariant.price,
            depot: invoiceDepot, // Use selectedDepot instead of currentVariant.depot
          })
        }
      }
      // Handle manual entry (existing code)
      else {
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
   const firstVariantPrice = currentVariants[0]?.unitPrice || currentVariant.unitPrice
        newItems.push({
          id: `item-${Date.now()}-${newItems.length}`,
          productId: selectedProduct.id,
          productName: selectedProduct.title || selectedProduct.name,
          variantId: matchingVariant.id,
          attributes: matchingVariant.title || matchingVariant.attributes,
          quantity: currentVariant.quantity,
          packQuantity: currentVariant.packQuantity,
          packSize: currentVariant.packSize,
          unitPrice: currentVariant.unitPrice,
          depot: invoiceDepot, // Use selectedDepot instead of currentVariant.depot
        })
      }
    }

    if (newItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun article valide à ajouter à la facture.",
        variant: "destructive",
      })
      return
    }

    setInvoiceItems([...invoiceItems, ...newItems])
    setSelectedProductId("")
    setCurrentVariants([])
    setProductEntryMode("manual")

    toast({
      title: "Articles ajoutés",
      description: `${newItems.length} article(s) ajouté(s) à la facture.`,
    })
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (invoiceItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un article à la facture.",
        variant: "destructive",
      })
      return
    }

    const invoicePayload = {
      ...invoiceData,
      supplier: selectedSupplier,
      items: invoiceItems,
      total: calculateTotal(),
      type: "achat",
    }

    try {
      if (isEditing) {
        // Update existing invoice
        await updateInvoice({
          ...invoicePayload,
          id: initialData.id,
        })
        toast({
          title: "Facture mise à jour",
          description: `La facture ${invoiceData.invoiceNumber} a été mise à jour avec succès.`,
        })
      } else {
        // Add new invoice
        await addInvoice(invoicePayload)
        toast({
          title: "Facture créée",
          description: `La facture ${invoiceData.invoiceNumber} a été créée avec succès.`,
        })
      }

      // Réinitialiser le formulaire
      setInvoiceItems([])
      setSelectedProductId("")
      setCurrentVariants([])
      setSelectedSupplier(null)
      setProductEntryMode("manual")

      // Fermer le formulaire
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la facture.",
        variant: "destructive",
      })
    }
  }

  // Formater l'affichage d'un attribut
  const formatAttributeDisplay = (attr: VariantAttribute) => {
    const typeLabels: Record<string, string> = {
      size: "Taille",
      color: "Couleur",
      material: "Matériau",
    }

    return `${typeLabels[attr.type] || attr.type}: ${attr.value}`
  }

  // Get depot name by ID
  const getDepotName = (depotId: string) => {
    // First check in product depots
    const productDepot = productDepots.find((d) => d.id === depotId)
    if (productDepot) return productDepot.name

    // If not found, check in global depots list
    return "Non spécifié"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditing ? "Modifier la facture d'achat" : "Nouvelle facture d'achat"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Modifiez les détails de votre facture d'achat et les articles concernés."
                : "Ajoutez les détails de votre facture d'achat et les articles concernés."}
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
                    placeholder="ex: FACT-A-001-2023"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="supplier"
                      value={invoiceData.supplier}
                      onChange={(e) => handleInvoiceDataChange("supplier", e.target.value)}
                      placeholder="Nom du fournisseur"
                      required
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={() => setIsSuppliersManagementOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Gérer
                    </Button>
                  </div>
                  {selectedSupplier && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Contact: {selectedSupplier.contact} | Tél: {selectedSupplier.phone}
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
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={invoiceData.status}
                    onValueChange={(value) => handleInvoiceDataChange("status", value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Depot selection for the entire invoice */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dépôt pour cette facture</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="invoice-depot">Sélectionnez un dépôt pour tous les articles de cette facture</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDepotsManagementOpen(true)}>
                    <Package className="h-4 w-4 mr-2" />
                    Gérer les dépôts
                  </Button>
                </div>

                {allDepots.length > 0 ? (
                  <Select
                    value={invoiceDepot}
                    onValueChange={(value) => {
                      setInvoiceDepot(value)
                      // Force a UI update by showing a toast notification
                      const depotName = allDepots.find((d) => d.id === value)?.name || "Non spécifié"
                      toast({
                        title: "Dépôt modifié",
                        description: `Le dépôt "${depotName}" a été sélectionné pour cette facture.`,
                      })
                    }}
                  >
                    <SelectTrigger id="invoice-depot">
                      <SelectValue placeholder="Sélectionner un dépôt pour cette facture" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDepots.map((depot) => (
                        <SelectItem key={depot.id} value={depot.id}>
                          {depot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-red-500 p-2 border border-red-200 rounded-md bg-red-50">
                    Aucun dépôt n'est configuré. Veuillez en ajouter dans la gestion des dépôts.
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Ajout d'articles */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ajouter des articles</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Produit</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title || product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Dépôt sélectionné: {allDepots.find((d) => d.id === invoiceDepot)?.name || "Non spécifié"}
                    </p>
                  </div>
                )}

                {selectedProduct && (
                  <div className="space-y-4">
                    <Tabs
                      value={productEntryMode}
                      onValueChange={(value) => setProductEntryMode(value as "manual" | "pack")}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
                        <TabsTrigger value="pack">Sélectionner un pack</TabsTrigger>
                      </TabsList>

                      <TabsContent value="manual" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Variantes de {selectedProduct.title || selectedProduct.name}</h4>
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
                                  {selectedProduct.options?.map((attrType) => (
                                    <div key={attrType.id} className="space-y-2">
                                      <Label htmlFor={`${variant.id}-${attrType.id}`}>{attrType.name}</Label>
                                      <Select
                                        value={variant.attributes[attrType.name] || ""}
                                        onValueChange={(value) => updateVariant(variant.id, attrType.name, value)}
                                      >
                                        <SelectTrigger id={`${variant.id}-${attrType.id}`}>
                                          <SelectValue placeholder={`Sélectionner une${attrType.name}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {attrType.values?.map((value) => (
                                            <SelectItem key={value} value={value}>
                                              {value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ))}

                                  <div className="space-y-2">
                                    <Label htmlFor={`${variant.id}-quantity`}>{"Quantité (unités)"}</Label>
                                    <Input
                                      id={`${variant.id}-quantity`}
                                      type="number"
                                      min="1"
                                      value={variant.quantity}
                                      onChange={(e) => {
                                        const value = Number.parseInt(e.target.value) || 1
                                        updateVariant(variant.id, "quantity", value)
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`${variant.id}-price`}>Prix unitaire (DZD)</Label>
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
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                      Total: {variant.quantity * variant.unitPrice}DZD
                                    </Badge>
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
                      </TabsContent>

                      <TabsContent value="pack" className="space-y-4">
                        <div className="space-y-4">
                          <h4 className="font-medium">
                            Packs disponibles pour {selectedProduct.title || selectedProduct.name}
                          </h4>

                          {filteredPacks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredPacks?.map((pack) => (
                                <Card key={pack.id} className="overflow-hidden">
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{pack.name}</CardTitle>
                                    {pack.description && (
                                      <p className="text-sm text-muted-foreground">{pack.description}</p>
                                    )}
                                  </CardHeader>
                                  <CardContent className="pb-2">
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-medium">Combinaisons:</h5>
                                      <ul className="text-sm space-y-1">
                                        {pack.variants &&
                                          pack.variants?.map((variant, idx) => (
                                            <li key={idx} className="flex justify-between">
                                              <span>
                                                {Object.entries(variant)
                                                  .filter(([key]) => key !== "id" && key !== "unity")
                                                  ?.map(
                                                    ([key, value]) =>
                                                      `${key === "size" ? "Taille" : key === "color" ? "Couleur" : key === "material" ? "Matériau" : key}: ${value}`,
                                                  )
                                                  .join(", ")}
                                              </span>
                                              <span className="font-medium">Qté: {variant.unity || 1}</span>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  </CardContent>
                                  <CardFooter className="pt-2 flex flex-col space-y-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => applyPackToProduct(pack)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Appliquer et modifier
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => addPackDirectlyToInvoice(pack)}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Ajouter directement
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-6 border rounded-md bg-muted/50">
                              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                              <p>Aucun pack disponible pour ce produit</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => setIsPacksManagementOpen(true)}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Gérer les packs
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    {currentVariants.length > 0 && invoiceDepot && (
                      <div className="flex justify-end">
                        <Button type="button" onClick={addVariantsToInvoice}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter à la facture
                        </Button>
                      </div>
                    )}
                    {currentVariants.length > 0 && !invoiceDepot && (
                      <div className="text-center p-2 border border-red-200 rounded-md bg-red-50 mt-4">
                        <p className="text-red-600">
                          Veuillez sélectionner un dépôt pour cette facture avant d'ajouter des articles.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Liste des articles */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Articles de la facture</h3>
              {invoiceItems.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Variantes</TableHead>
                        <TableHead>Dépôt</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Prix total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(
                        invoiceItems.reduce(
                          (acc, item) => {
                            if (!acc[item.productName]) acc[item.productName] = []
                            acc[item.productName].push(item)
                            return acc
                          },
                          {} as Record<string, typeof invoiceItems>,
                        ),
                      ).map(([productName, items]) => {
                        const { variantsText, totalQuantity } = items.reduce(
                          (acc, item) => {
                            const attrText =
                              typeof item.attributes === "string"
                                ? item.attributes
                                : Array.isArray(item.attributes)
                                  ? item.attributes.map((attr) => `${attr.type}: ${attr.value}`).join(", ")
                                  : "N/A"

                            acc.variantsText += `${attrText} / ${item.quantity}\n`
                            acc.totalQuantity += item.quantity
                            return acc
                          },
                          { variantsText: "", totalQuantity: 0 },
                        )
                        const unitPrice = items[0]?.unitPrice || 0
                        const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

                        // Find the product to get its depots
                        const product = products?.find((p) => p.id === items[0]?.productId)

                        return (
                          <TableRow key={productName}>
                            <TableCell>{productName}</TableCell>
                            <TableCell className="whitespace-pre-line w-[150px]">{variantsText}</TableCell>
                            <TableCell>
                              {items.map((item) => {
                                // Find depot name from product's depots
                                const depotName =
                                  product?.depots?.find((d) => d.id === item.depot)?.name || "Non spécifié"
                                return <div key={item.id}>{depotName}</div>
                              })}
                            </TableCell>
                            <TableCell>{totalQuantity}</TableCell>
                            <TableCell>{unitPrice.toFixed(2)} DZD</TableCell>
                            <TableCell>{totalPrice.toFixed(2)} DZD</TableCell>
                            <TableCell>
                              {items.map((item) => (
                                <Button
                                  key={item.id}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeInvoiceItem(item.id)}
                                  className="mr-1"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              ))}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-medium">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold">{calculateTotal().toFixed(2)} DZD</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md bg-muted/50">
                  <p>Aucun article ajouté à la facture</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={invoiceData.notes}
                onChange={(e) => handleInvoiceDataChange("notes", e.target.value)}
                placeholder="Notes ou commentaires sur cette facture"
              />
            </div>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Mettre à jour la facture" : "Enregistrer la facture"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>

      {/* Gestion des fournisseurs */}
      <SuppliersManagement
        open={isSuppliersManagementOpen}
        onOpenChange={setIsSuppliersManagementOpen}
        onSelectSupplier={handleSelectSupplier}
        selectable={true}
      />

      {/* Gestion des packs */}
      <PacksManagement
        open={isPacksManagementOpen}
        onOpenChange={setIsPacksManagementOpen}
        onSelectPack={handleSelectPack}
        selectable={true}
      />

      {/* Gestion des dépôts */}
      <DepotsManagement
        open={isDepotsManagementOpen}
        onOpenChange={setIsDepotsManagementOpen}
        onSelectDepot={handleSelectDepot}
        selectable={true}
      />
    </Sheet>
  )
}
