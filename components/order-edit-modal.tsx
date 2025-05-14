"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useShop,
  type Order,
  type DeliveryType,
  type DeliveryCompany,
  type ConfirmationStatus,
  type StockStatus,
} from "@/context/shop-context"
import { toast } from "@/components/ui/use-toast"
import { X, Plus, Trash2, AlertTriangle, Clock } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  getAllWilayas,
  getCommunesByWilayaName,
  normalizeString,
} from "@/app/admin/commandes/en-attente/data/algeria-regions"
import { getYalidinCentersForCommune } from "@/app/admin/commandes/en-attente/data/yalidin-centers"
import { isStopDeskAvailable } from "@/app/admin/commandes/en-attente/data/shipping-availability"
import { useAppContext } from "@/context/app-context"

// Types pour les articles
type ArticleVariant = {
  id: string
  size?: string
  color?: string
  quantity: number
  price: number
  inventoryVariantId?: string // Add this to track the original inventory variant
  availableStock?: number // Add this to show available stock
  stockStatus?: StockStatus // Add this to track stock status
  expectedDate?: string // Add this for coming soon items
}

type Article = {
  id: string
  name: string
  sku: string
  variants: ArticleVariant[]
}

// Liste des articles disponibles
const availableArticles = [
  "Smartphone Samsung Galaxy S23",
  "iPhone 15 Pro",
  "Écouteurs sans fil",
  "Montre connectée",
  "Tablette iPad",
  "Ordinateur portable",
  "Caméra GoPro",
  "Enceinte Bluetooth",
  "Chargeur sans fil",
  "Batterie externe",
  "Casque audio",
  "Clavier sans fil",
  "Souris ergonomique",
  "Imprimante laser",
  "Routeur WiFi",
]

// Liste des tailles disponibles
const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "Unique", "36", "38", "40", "42", "44"]

// Liste des couleurs disponibles
const availableColors = ["Noir", "Blanc", "Rouge", "Bleu", "Vert", "Jaune", "Orange", "Rose", "Violet", "Gris"]

// Liste des wilayas
const wilayas = [
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Blida",
  "Tlemcen",
  "Sétif",
  "Batna",
  "Béjaïa",
  "Tizi Ouzou",
  "Skikda",
  "Chlef",
  "Biskra",
]

// Liste des communes par wilaya
const communesByWilaya: Record<string, string[]> = {
  Alger: [
    "Centre Ville",
    "Bab El Oued",
    "El Biar",
    "Hydra",
    "Kouba",
    "Bir Mourad Raïs",
    "Bouzareah",
    "Chéraga",
    "Dar El Beïda",
    "Rouiba",
  ],
  Oran: ["Centre Ville", "Bir El Djir", "Es Senia", "Arzew", "Aïn El Turk", "Mers El Kébir"],
  Constantine: ["Centre Ville", "Sidi Mabrouk", "Zouaghi", "Ali Mendjeli", "El Khroub", "Hamma Bouziane"],
  // Ajouter d'autres wilayas et communes au besoin
}

// Liste des entreprises de livraison
const deliveryCompanies: DeliveryCompany[] = ["Yalidin", "DHL", "Aramex", "EMS", "Autre"]

// Liste des types de livraison
const deliveryTypes: DeliveryType[] = ["Domicile", "Point de relais", "Express"]

// Liste des statuts de confirmation
const confirmationStatuses: ConfirmationStatus[] = [
  "En attente",
  "Confirmé",
  "Annulé",
  "Reporté",
  "Double",
  "Ne répond pas 1",
  "Ne répond pas 2",
  "Ne répond pas 3",
]

// Liste des points de relais
const pickupPoints = [
  "Bureau de poste central",
  "Agence commerciale",
  "Supermarché Carrefour",
  "Station-service",
  "Centre commercial",
  "Boutique partenaire",
]

// Liste des sources
const sources = ["Manuelle", "Boutique"]

// Liste des confirmatrices
const confirmatrices = ["Amina", "Fatima", "Leila", "Samira", "Yasmine", "Karima"]

type OrderEditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: Order
  isNew?: boolean
}

export function OrderEditModal({ open, onOpenChange, order, isNew = false }: OrderEditModalProps) {
  const {
    updateOrder,
    addOrder,
    getOrdersByStatus,
    inventory,
    getInventoryItem,
    updateConfirmationStatus,
    updateInventoryStock,
    deliveryCompanies,
  } = useShop()
  const [formData, setFormData] = useState<Partial<Order>>({})
  const [selectedWilaya, setSelectedWilaya] = useState<string>("")
  const [communes, setCommunes] = useState<any[]>([])
  const [selectedArticles, setSelectedArticles] = useState<any[]>([])
  const [isExchange, setIsExchange] = useState(false)
  const [previousOrders, setPreviousOrders] = useState<Order[]>([])
  const [selectedPreviousOrder, setSelectedPreviousOrder] = useState<string>("")

  const { products } = useAppContext()
  // Initialiser le formulaire avec les données de la commande
  useEffect(() => {
    if (order) {
      const cleanedDeliveryPrice = order.deliveryPrice?.replace(/\s?DZD$/, "") || "0"

      setFormData({
        ...order,
        deliveryPrice: cleanedDeliveryPrice,
      })
      //setFormData(order)
      setSelectedWilaya(order.wilaya)
      setCommunes(getCommunesByWilayaName(order.wilaya) || [])

      // Convertir les articles de la commande en format structuré
      const articleNames = order.articles
      const structuredArticles: Article[] = Object.values(
        articleNames.reduce<Record<string, Article>>((acc, item, index) => {
          const articleId = String(item.product_id)
          if (!acc[articleId]) {
            acc[articleId] = {
              id: `${articleId}`,
              name: item.product_name,
              sku: item.product_sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              variants: [],
            }
          }

          acc[articleId].variants.push({
            id: `variant-${item.variant_id}`,
            size: item.variant_options.option1,
            color: item.variant_options.option2,
            quantity: item.quantity,
            price: Number.parseFloat(item.unit_price),
            stockStatus: "available", // you can adjust logic for status if needed
            ...item,
          })

          return acc
        }, {}),
      )

      setSelectedArticles(structuredArticles)
    } else {
      // Valeurs par défaut pour une nouvelle commande
      const newOrderId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`
      const today = new Date().toLocaleDateString("fr-FR")

      setFormData({
        id: newOrderId,
        status: "Confirmés",
        confirmationStatus: "En attente",
        date: today,
        lastUpdated: new Date().toLocaleString("fr-FR"),
        smsStatus: "Non envoyé",
        trackingId: `TRK-${Math.floor(Math.random() * 100000)
          .toString()
          .padStart(6, "0")}`,
      })
      setSelectedArticles([])
      setSelectedWilaya("")
      setCommunes([])
    }

    // Charger les commandes précédentes pour l'échange
    const deliveredOrders = getOrdersByStatus("Livrés")
    setPreviousOrders(deliveredOrders)
  }, [order, getOrdersByStatus])

  // Mettre à jour les communes lorsque la wilaya change
  useEffect(() => {
    if (selectedWilaya) {
      const communes = getCommunesByWilayaName(order?.wilaya)
      setCommunes(communes || [])
    } else {
      setCommunes([])
    }
  }, [selectedWilaya])

  // Gérer les changements dans le formulaire
  const handleChange = (field: keyof Order, value: any) => {
    if (value === "Confirmé") {
      setFormData((prev) => ({ ...prev, [field]: value, status: "Confirmé" }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  }

  // Ajouter un nouvel article
  const addNewArticle = () => {
    const newArticle: Article = {
      id: `article-${Date.now()}`,
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      variants: [],
    }
    setSelectedArticles([...selectedArticles, newArticle])
  }

  // Supprimer un article
  const removeArticle = (articleId: string) => {
    setSelectedArticles(selectedArticles.filter((article) => article.id !== articleId))
  }

  // Mettre à jour un article
  const updateArticle = (articleId: string, field: keyof Article, value: any) => {
    if (field === "id") {
      // When article name changes, fetch inventory data
      const inventoryItem = products?.find((product) => product.id === value)

      setSelectedArticles(
        selectedArticles.map((article) => {
          if (article.id === articleId) {
            // If inventory item exists, update variants with stock info
            if (inventoryItem) {
              const updatedVariants = inventoryItem.variants.map((invVariant) => ({
                id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                size: invVariant.size || "Unique",
                color: invVariant.color || "Noir",
                quantity: 1,
                price: invVariant.price,
                unit_price: invVariant.unit_price,
                inventoryVariantId: invVariant.id,
                availableStock: "0",
                stockStatus: "available",
                expectedDate: "",
              }))

              return {
                ...article,
                ...inventoryItem,
                [field]: value,
                name: inventoryItem.title,
                sku: inventoryItem.sku,
                variants: [updatedVariants[0]], // Keep only the first variant for now
              }
            } else {
              // If no inventory item, just update the name
              return { ...article, [field]: value }
            }
          }
          return article
        }),
      )
    } else {
      // For other fields, just update normally
      setSelectedArticles(
        selectedArticles.map((article) => (article.id === articleId ? { ...article, [field]: value } : article)),
      )
    }
  }

  // Ajouter une variante à un article
  const addVariant = (articleId: string) => {
    setSelectedArticles(
      selectedArticles.map((article) => {
        if (article.id === articleId) {
          return {
            ...article,
            variants: [
              ...article.variants,
              {
                id: `variant-${articleId}-${article.variants.length}`,
                size: "Unique",
                color: "Noir",
                quantity: 1,
                price: products.find((product) => product.id)?.variants[0].price || 0,
                stockStatus: "available",
              },
            ],
          }
        }
        return article
      }),
    )
  }

  // Supprimer une variante
  const removeVariant = (articleId: string, variantId: string) => {
    setSelectedArticles(
      selectedArticles.map((article) => {
        if (article.id === articleId) {
          return {
            ...article,
            variants: article.variants.filter((variant) => variant.id !== variantId),
          }
        }
        return article
      }),
    )
  }

  // Mettre à jour une variante
  const updateVariant = (articleId: string, variantId: string, field: keyof ArticleVariant, value: any) => {
    setSelectedArticles(
      selectedArticles.map((article) => {
        if (article.id === articleId) {
          return {
            ...article,
            variants: article.variants.map((variant) => {
              if (variant.id === variantId) {
                // If updating price, also update unit_price and vice versa
                if (field === "price") {
                  return { ...variant, price: value, unit_price: value }
                } else if (field === "unit_price") {
                  return { ...variant, unit_price: value, price: value }
                }
                return { ...variant, [field]: value }
              }
              return variant
            }),
          }
        }
        return article
      }),
    )
  }

  // Charger les articles d'une commande précédente
  const loadPreviousOrderArticles = () => {
    if (!selectedPreviousOrder) return

    const previousOrder = previousOrders.find((order) => order.id === selectedPreviousOrder)
    if (!previousOrder) return

    const articleNames = previousOrder.articles.split(", ")
    const structuredArticles: Article[] = articleNames.map((name, index) => ({
      id: `article-${index}`,
      name,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      variants: [
        {
          id: `variant-${index}-0`,
          size: "Unique",
          color: "Noir",
          quantity: 1,
          price: Math.floor(500 + Math.random() * 1500),
          stockStatus: "available",
        },
      ],
    }))

    setSelectedArticles(structuredArticles)
  }

  // Calculer le prix total
  const calculateTotalPrice = () => {
    let total = 0
    selectedArticles.forEach((article) => {
      article.variants.forEach((variant) => {
        total += variant.price * variant.quantity
      })
    })
    return total
  }

  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    // Vérifier les champs obligatoires
    if (!formData.name || !formData.phone || selectedArticles.length === 0 || !selectedWilaya || !formData.commune) {
      toast({
        title: "Champs obligatoires manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    // Update inventory stock for each article variant
    selectedArticles.forEach((article) => {
      const inventoryItem = getInventoryItem(article.name)
      if (inventoryItem) {
        article.variants.forEach((variant) => {
          if (variant.inventoryVariantId) {
            updateInventoryStock(inventoryItem.id, variant.inventoryVariantId, variant.quantity)
          }
        })
      }
    })

    // Calculate the total price
    const totalPrice = calculateTotalPrice() + (Number(formData.deliveryPrice) || 0)

    // Update the articles and total price
    const updatedFormData = {
      ...formData,
      wilaya: selectedWilaya,
      totalPrice: totalPrice,
      articles: selectedArticles.flatMap((article) =>
        article.variants.map((variant) => ({
          product_id: article.id,
          product_name: article.name,
          product_sku: article.sku || "",
          quantity: variant.quantity,
          unit_price: variant.unit_price || variant.price,
          variant_id: variant.variant_id || variant.id,
          variant_sku: variant.variant_sku || "",
          variant_title: variant.variant_title || "",
          variant_options: {
            option1: variant.size,
            option2: variant.color,
          },
        })),
      ),
    }

    if (isNew) {
      addOrder(updatedFormData as Order)
      toast({
        title: "Commande ajoutée",
        description: `La commande ${updatedFormData.id} a été ajoutée avec succès.`,
      })
    } else {
      updateOrder(order!.id, updatedFormData)
      toast({
        title: "Commande mise à jour",
        description: `La commande ${order!.id} a été mise à jour avec succès.`,
      })
    }

    onOpenChange(false)
  }

  // Function to render stock status with appropriate styling
  const renderStockStatus = (variant: ArticleVariant) => {
    if (!variant.stockStatus || variant.stockStatus === "available") {
      return (
        <div className="h-8 px-3 py-1 rounded text-xs flex items-center bg-green-900/20 text-green-400">
          {variant.availableStock !== undefined ? variant.availableStock : "En stock"}
        </div>
      )
    } else if (variant.stockStatus === "coming_soon") {
      return (
        <div className="h-8 px-3 py-1 rounded text-xs flex items-center bg-yellow-900/20 text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Bientôt disponible {variant.expectedDate ? `(${variant.expectedDate})` : ""}
        </div>
      )
    } else {
      return (
        <div className="h-8 px-3 py-1 rounded text-xs flex items-center bg-red-900/20 text-red-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Non disponible
        </div>
      )
    }
  }
  function getVariantOptionValue({ product, variant, label }) {
    const optionIndex = product?.options?.findIndex(
      (opt) =>
        opt.name.toLowerCase() === label.toLowerCase() ||
        (label === "Taille" && ["pointure", "taille"].includes(opt.name.toLowerCase())),
    )

    if (optionIndex === 0) return variant?.option1
    if (optionIndex === 1) return variant?.option2
    return ""
  }

  const [isRestockMode, setIsRestockMode] = useState(false)
  const [exchangeArticles, setExchangeArticles] = useState<Article[]>([])
  // Add a new article for exchange
  const addExchangeArticle = () => {
    const newArticle: Article = {
      id: `exchange-article-${Date.now()}`,
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      variants: [],
    }
    setExchangeArticles([...exchangeArticles, newArticle])
  }

  // Remove an exchange article
  const removeExchangeArticle = (articleId: string) => {
    setExchangeArticles(exchangeArticles.filter((article) => article.id !== articleId))
  }

  // Update an exchange article
  const updateExchangeArticle = (articleId: string, field: keyof Article, value: any) => {
    if (field === "name") {
      // When article name changes, fetch inventory data
      const inventoryItem = getInventoryItem(value)

      setExchangeArticles(
        exchangeArticles.map((article) => {
          if (article.id === articleId) {
            // If inventory item exists, update variants with stock info
            if (inventoryItem) {
              const updatedVariants = inventoryItem.variants.map((invVariant) => ({
                id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                size: invVariant.size || "Unique",
                color: invVariant.color || "Noir",
                quantity: invVariant.price,
                price: invVariant.price,
                inventoryVariantId: invVariant.id,
                availableStock: invVariant.stock,
                stockStatus: invVariant.stockStatus,
                expectedDate: invVariant.expectedDate,
              }))

              return {
                ...article,
                [field]: value,
                sku: inventoryItem.sku,
                variants: updatedVariants.length > 0 ? updatedVariants : article.variants,
              }
            } else {
              // If no inventory item, just update the name
              return { ...article, [field]: value }
            }
          }
          return article
        }),
      )
    } else {
      // For other fields, just update normally
      setExchangeArticles(
        exchangeArticles.map((article) => (article.id === articleId ? { ...article, [field]: value } : article)),
      )
    }
  }

  // Add a variant to an exchange article
  const addExchangeVariant = (articleId: string) => {
    setExchangeArticles(
      exchangeArticles.map((article) => {
        if (article.id === articleId) {
          return {
            ...article,
            variants: [...article.variants],
          }
        }
        return article
      }),
    )
  }

  // Remove a variant from an exchange article
  const removeExchangeVariant = (articleId: string, variantId: string) => {
    setExchangeArticles(
      exchangeArticles.map((article) => {
        if (article.id === articleId) {
          return {
            ...article,
            variants: article.variants.filter((variant) => variant.id !== variantId),
          }
        }
        return article
      }),
    )
  }

  // Update a variant in an exchange article
  const updateExchangeVariant = (articleId: string, variantId: string, field: keyof ArticleVariant, value: any) => {
    setExchangeArticles(
      exchangeArticles.map((article) => {
        if (article.id === articleId) {
          return {
            ...article,
            variants: article.variants.map((variant) =>
              variant.id === variantId ? { ...variant, [field]: value } : variant,
            ),
          }
        }
        return article
      }),
    )
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRestockMode
              ? "Réapprovisionnement de stock"
              : isNew
                ? "Ajouter une commande"
                : `Modifier la commande ${order?.id}`}
          </DialogTitle>
          <DialogDescription>
            {isRestockMode
              ? "Sélectionnez les articles et variantes à réapprovisionner."
              : isNew
                ? "Remplissez les informations pour ajouter une nouvelle commande."
                : "Modifiez les informations de la commande."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Informations client */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-medium">Informations client</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du client *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone principal *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2">Téléphone secondaire</Label>
                <Input
                  id="phone2"
                  value={formData.phone2 || ""}
                  onChange={(e) => handleChange("phone2", e.target.value)}
                  className="bg-slate-800/50 border-slate-700"
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2 mr-4">
                  <Switch id="isExchange" checked={isExchange} onCheckedChange={setIsExchange} />
                  <Label htmlFor="isExchange">Commande d'échange</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="isRestockMode" checked={isRestockMode} onCheckedChange={setIsRestockMode} />
                  <Label htmlFor="isRestockMode">Mode réapprovisionnement</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Articles *</h3>
              <Button
                onClick={addNewArticle}
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            </div>

            {selectedArticles.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-700 rounded-md">
                <p className="text-slate-400">Aucun article sélectionné. Ajoutez un article pour continuer.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedArticles.map((article, index) => (
                  <div key={article.id} className="p-4 border border-slate-700 rounded-md bg-slate-800/30">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Article {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeArticle(article.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor={`article-name-${article.id}`}>Nom de l'article *</Label>
                        <Select value={article.id} onValueChange={(value) => updateArticle(article.id, "id", value)}>
                          <SelectTrigger id={`article-name-${article.id}`} className="bg-slate-800/50 border-slate-700">
                            <SelectValue placeholder="Sélectionner un article" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`article-sku-${article.id}`}>SKU</Label>
                        <Input
                          id={`article-sku-${article.id}`}
                          value={article.sku}
                          onChange={(e) => updateArticle(article.id, "sku", e.target.value)}
                          className="bg-slate-800/50 border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm font-medium">Variantes</h5>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addVariant(article.id)}
                          className="text-xs border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter une variante
                        </Button>
                      </div>

                      {article.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-2 border border-slate-700 rounded bg-slate-800/20"
                        >
                          <div className="space-y-1">
                            <Label htmlFor={`variant-size-${variant.id}`} className="text-xs">
                              Taille
                            </Label>
                            <Select
                              value={variant.size}
                              onValueChange={(value) => updateVariant(article.id, variant.id, "size", value)}
                            >
                              <SelectTrigger
                                id={`variant-size-${variant.id}`}
                                className="h-8 text-xs bg-slate-800/50 border-slate-700"
                              >
                                <SelectValue placeholder="Taille" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800">
                                {products
                                  ?.find((p) => p.id === article.id)
                                  ?.options.find((opt) => ["Pointure", "pointure", "Taille"].includes(opt.name))
                                  ?.values.map((size: string) => (
                                    <SelectItem key={size} value={size}>
                                      {size}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`variant-color-${variant.id}`} className="text-xs">
                              Couleur
                            </Label>
                            <Select
                              value={variant.color}
                              onValueChange={(value) => updateVariant(article.id, variant.id, "color", value)}
                            >
                              <SelectTrigger
                                id={`variant-color-${variant.id}`}
                                className="h-8 text-xs bg-slate-800/50 border-slate-700"
                              >
                                <SelectValue placeholder="Couleur" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800">
                                {products
                                  ?.find((p) => p.id === article.id)
                                  ?.options.find((opt) => opt.name === "Couleur")
                                  ?.values.map((color: string) => (
                                    <SelectItem key={color} value={color}>
                                      {color}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`variant-quantity-${variant.id}`} className="text-xs">
                              Quantité
                            </Label>
                            <Input
                              id={`variant-quantity-${variant.id}`}
                              type="number"
                              min="1"
                              max={variant.stockStatus === "available" ? variant.availableStock : 0}
                              value={variant.quantity}
                              onChange={(e) =>
                                updateVariant(article.id, variant.id, "quantity", Number.parseInt(e.target.value) || 1)
                              }
                              className="h-8 text-xs bg-slate-800/50 border-slate-700"
                              disabled={variant.stockStatus !== "available"}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`variant-stock-${variant.id}`} className="text-xs">
                              Stock disponible
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {products
                                ?.find((product) => product.id === article.id)
                                ?.variants.find((v) => v.id === variant.id)?.inventory_quantity ?? 0}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`variant-price-${variant.id}`} className="text-xs">
                              Prix unitaire (DA)
                            </Label>
                            <Input
                              id={`variant-price-${variant.id}`}
                              type="number"
                              min="0"
                              value={variant.unit_price || variant.price}
                              onChange={(e) => {
                                const newPrice = Number.parseInt(e.target.value) || 0
                                updateVariant(article.id, variant.id, "unit_price", newPrice)
                                updateVariant(article.id, variant.id, "price", newPrice)
                              }}
                              className="h-8 text-xs bg-slate-800/50 border-slate-700"
                            />
                          </div>

                          <div className="flex justify-end">
                            {article.variants.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariant(article.id, variant.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-slate-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {isExchange && (
            <div className="md:col-span-2 py-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-sm text-slate-400">Échange d'articles</span>
                </div>
              </div>
            </div>
          )}

          {/* Articles d'échange (nouveaux articles) */}
          {isExchange && (
            <div className="space-y-4 md:col-span-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Articles à envoyer (Échange)</h3>
                <Button
                  onClick={addExchangeArticle}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article d'échange
                </Button>
              </div>

              {exchangeArticles.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700 rounded-md">
                  <p className="text-slate-400">
                    Aucun article d'échange sélectionné. Ajoutez les articles que le client recevra en échange.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {exchangeArticles.map((article, index) => (
                    <div key={article.id} className="p-4 border border-slate-700 rounded-md bg-slate-800/30">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Article d'échange {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExchangeArticle(article.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label htmlFor={`exchange-article-name-${article.id}`}>Nom de l'article *</Label>
                          <Select
                            value={article.id}
                            onValueChange={(value) => updateExchangeArticle(article.id, "id", value)}
                          >
                            <SelectTrigger
                              id={`exchange-article-name-${article.id}`}
                              className="bg-slate-800/50 border-slate-700"
                            >
                              <SelectValue placeholder="Sélectionner un article" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {products?.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`exchange-article-sku-${article.id}`}>SKU</Label>
                          <Input
                            id={`exchange-article-sku-${article.id}`}
                            value={article.sku}
                            onChange={(e) => updateExchangeArticle(article.id, "sku", e.target.value)}
                            className="bg-slate-800/50 border-slate-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="text-sm font-medium">Variantes</h5>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addExchangeVariant(article.id)}
                            className="text-xs border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter une variante
                          </Button>
                        </div>

                        {article.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-2 border border-slate-700 rounded bg-slate-800/20"
                          >
                            <div className="space-y-1">
                              <Label htmlFor={`exchange-variant-size-${variant.id}`} className="text-xs">
                                Taille
                              </Label>
                              <Select
                                value={variant.size || "Unique"}
                                onValueChange={(value) => updateExchangeVariant(article.id, variant.id, "size", value)}
                              >
                                <SelectTrigger
                                  id={`exchange-variant-size-${variant.id}`}
                                  className="h-8 text-xs bg-slate-800/50 border-slate-700"
                                >
                                  <SelectValue placeholder="Taille" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                  {products
                                    ?.find((product) => product.id === article.id)
                                    ?.options.find(
                                      (opt) =>
                                        opt.name === "Pointure" || opt.name === "pointure" || opt.name === "Taille",
                                    )
                                    ?.values.map((size) => (
                                      <SelectItem key={size} value={size}>
                                        {size}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`exchange-variant-color-${variant.id}`} className="text-xs">
                                Couleur
                              </Label>
                              <Select
                                value={variant.color || "Noir"}
                                onValueChange={(value) => updateExchangeVariant(article.id, variant.id, "color", value)}
                              >
                                <SelectTrigger
                                  id={`exchange-variant-color-${variant.id}`}
                                  className="h-8 text-xs bg-slate-800/50 border-slate-700"
                                >
                                  <SelectValue placeholder="Couleur" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                  {products
                                    ?.find((product) => product.id === article.id)
                                    ?.options.find((opt) => opt.name === "Couleur")
                                    ?.values.map((size) => (
                                      <SelectItem key={size} value={size}>
                                        {size}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`exchange-variant-quantity-${variant.id}`} className="text-xs">
                                Quantité
                              </Label>
                              <Input
                                id={`exchange-variant-quantity-${variant.id}`}
                                type="number"
                                min="1"
                                max={variant.stockStatus === "available" ? variant.availableStock : 0}
                                value={variant.quantity}
                                onChange={(e) =>
                                  updateExchangeVariant(
                                    article.id,
                                    variant.id,
                                    "quantity",
                                    Number.parseInt(e.target.value) || 1,
                                  )
                                }
                                className="h-8 text-xs bg-slate-800/50 border-slate-700"
                                disabled={variant.stockStatus !== "available"}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`exchange-variant-stock-${variant.id}`} className="text-xs">
                                Stock actuel
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {products
                                  ?.find((product) => product.id === article.id)
                                  ?.variants.find((v) => v.id === variant.id)?.inventory_quantity ?? 0}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`exchange-variant-price-${variant.id}`} className="text-xs">
                                Prix unitaire (DA)
                              </Label>
                              <Input
                                id={`exchange-variant-price-${variant.id}`}
                                type="number"
                                min="0"
                                value={
                                  products
                                    ?.find((product) => product.id === article.id)
                                    ?.variants.find(
                                      (v) =>
                                        [variant.size, variant.color]?.includes(v.option1) &&
                                        [variant.size, variant.color]?.includes(v.option2),
                                    )?.price
                                }
                                onChange={(e) =>
                                  updateExchangeVariant(
                                    article.id,
                                    variant.id,
                                    "price",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="h-8 text-xs bg-slate-800/50 border-slate-700"
                              />
                            </div>

                            <div className="flex justify-end">
                              {article.variants.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExchangeVariant(article.id, variant.id)}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-slate-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Informations de livraison */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-medium">Informations de livraison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wilaya">Wilaya *</Label>
                <Select
                  value={formData.wilaya}
                  onValueChange={(value) => {
                    const selectedWilaya = getAllWilayas().find((w) => w.code === value)
                    setSelectedWilaya(selectedWilaya?.name_ascii)
                    handleChange("wilaya", value)
                    handleChange("wilayaName", selectedWilaya?.name_ascii)
                    handleChange("wilayaCode", value)
                  }}
                >
                  <SelectTrigger id="wilaya" className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Sélectionner une wilaya" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {getAllWilayas().map((wilaya) => (
                      <SelectItem key={wilaya.code} value={wilaya.code}>
                        {wilaya.name_ascii}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commune">Commune *</Label>
                <Select
                  value={formData.commune || ""}
                  onValueChange={(value) => handleChange("commune", value)}
                  disabled={!selectedWilaya}
                >
                  <SelectTrigger id="commune" className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Sélectionner une commune" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {getCommunesByWilayaName(selectedWilaya)
                      .map((commune) => ({
                        id: commune.id,
                        namefr: commune.commune_name_ascii,
                        namear: commune.commune_name,
                        normalizedName: normalizeString(commune.commune_name_ascii),
                      }))
                      .sort((a, b) => a.namefr.localeCompare(b.namefr))
                      .map((commune) => {
                        const isSelected = normalizeString(commune.namefr) === normalizeString(order?.commune)
                        const hasStopDesk = isStopDeskAvailable(commune.namefr)

                        return (
                          <SelectItem
                            key={commune.id}
                            value={commune.namefr}
                            className={isSelected ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {commune.namefr} {commune.namear ? `(${commune.namear})` : ""}
                                {isSelected && " ✓"}
                              </span>
                              {!hasStopDesk && order?.deliveryType === "stopdesk" && (
                                <span className="text-amber-500 text-xs font-medium ml-2 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded">
                                  no stopdesk
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryType">Type de livraison *</Label>
                <Select
                  value={formData.deliveryType || ""}
                  onValueChange={(value) => handleChange("deliveryType", value)}
                >
                  <SelectTrigger id="deliveryType" className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {["stopdesk", "domicile"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryCompany">Entreprise de livraison *</Label>
                <Select
                  value={formData.deliveryCompany || ""}
                  onValueChange={(value) => handleChange("deliveryCompany", value)}
                >
                  <SelectTrigger id="deliveryCompany" className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {[...deliveryCompanies, { companyId: "deliveryMen" }].map((center) => (
                      <SelectItem key={center.companyId} value={center.companyId}>
                        {center.companyId || "Non défini"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.deliveryType === "stopdesk" && (
                <div className="space-y-2">
                  <Label htmlFor="deliveryCenter">Point de relais *</Label>
                  <Select
                    value={formData.deliveryCenter || ""}
                    onValueChange={(value) => handleChange("deliveryCenter", value)}
                  >
                    <SelectTrigger id="deliveryCenter" className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Sélectionner un point de relais" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {getYalidinCentersForCommune(formData.commune)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((desk) => {
                          // Use key for NOEST centers and center_id for Yalidin centers
                          const centerId = desk.center_id
                          return (
                            <SelectItem key={centerId} value={centerId?.toString() || ""}>
                              {desk.name}
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Textarea
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="bg-slate-800/50 border-slate-700 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Informations supplémentaires</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo || ""}
                  onChange={(e) => handleChange("additionalInfo", e.target.value)}
                  className="bg-slate-800/50 border-slate-700 min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Informations de paiement */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-medium">Informations de paiement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryPrice">Prix de livraison (DA) *</Label>
                <Input
  id="deliveryPrice"
  type="number"
  value={formData.deliveryPrice || ""}
  onChange={(e) => handleChange("deliveryPrice", Number(e.target.value))}
  className="bg-slate-800/50 border-slate-700"
/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calculatedTotalPrice">Prix total calculé (DA)</Label>
                <Input
                  id="calculatedTotalPrice"
                  type="number"
                  value={calculateTotalPrice() + (Number(formData.deliveryPrice) || 0)}
                  disabled
                  className="bg-slate-800/50 border-slate-700 opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-4 md:col-span-2">
            <h3 className="text-lg font-medium">Informations supplémentaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Select
                  disabled={!isNew}
                  value={formData.source || ""}
                  onValueChange={(value) => handleChange("source", value)}
                >
                  <SelectTrigger id="source" className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {sources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmationStatus">Statut de confirmation *</Label>
                <Select
                  value={formData.confirmationStatus || ""}
                  onValueChange={(value) => {
                    handleChange("confirmationStatus", value)
                  }}
                >
                  <SelectTrigger id="confirmationStatus" className="bg-slate-800/50 border-slate-700">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {confirmationStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
          >
            {isNew ? "Ajouter" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
