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
import { useAppContext } from "@/context/app-context"
import { toast } from "@/components/ui/use-toast"
import { X, Plus, Trash2, AlertTriangle, Clock, Warehouse } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  getAllWilayas,
  getCommunesByWilayaName,
  normalizeString,
} from "@/app/admin/commandes/en-attente/data/algeria-regions"
import { getYalidinCentersForCommune } from "@/app/admin/commandes/en-attente/data/yalidin-centers"
import { isStopDeskAvailable } from "@/app/admin/commandes/en-attente/data/shipping-availability"

import { collection, doc, getDoc, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"

// Types pour les articles
type ArticleVariant = {
  id: string
  size?: string
  color?: string
  quantity: number
  price: number
  inventoryVariantId?: string
  availableStock?: number
  stockStatus?: StockStatus
  expectedDate?: string
  depot?: DepotOption[]
}

type DepotOption = {
  id: string
  name: string
  priority: string
  quantity: number
  type?: string
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
  "a modifier"
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
  confirm?: boolean
}

export function OrderEditModal({ open, onOpenChange, order, isNew = false, confirm = false,setOrder }: OrderEditModalProps) {
  const {
    updateOrder,
    addOrder,
    getOrdersByStatus,
    inventory,
    getInventoryItem,
    updateConfirmationStatus,
    updateInventoryStock,
    deliveryCompanies,
    deliveryPrices,
  } = useShop()
  const [formData, setFormData] = useState<Partial<Order>>({})
  const [selectedWilaya, setSelectedWilaya] = useState<string>("")
  const [communes, setCommunes] = useState<any[]>([])
  const [selectedArticles, setSelectedArticles] = useState<any[]>([])
  const [isExchange, setIsExchange] = useState(false)
  const [previousOrders, setPreviousOrders] = useState<Order[]>([])
  const [selectedPreviousOrder, setSelectedPreviousOrder] = useState<string>("")

  // Add these new state variables after the existing state declarations
  const [selectedDepots, setSelectedDepots] = useState<Record<string, DepotOption>>({})
  const [showDepotDialog, setShowDepotDialog] = useState(false)
  const [currentVariantForDepot, setCurrentVariantForDepot] = useState<{ articleId: string; variantId: string } | null>(
    null,
  )
  const [orderReference, setOrderReference] = useState("")
  const [isReferenceValid, setIsReferenceValid] = useState(true)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [availableDepots, setAvailableDepots] = useState<DepotOption[]>([])

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

        setAvailableDepots(depotsList)
      } catch (error) {
        console.error("Error fetching depots:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les dépôts depuis la base de données.",
          variant: "destructive",
        })

        // Fallback to default depots if Firebase fetch fails
        setAvailableDepots([
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

  const { products } = useAppContext()

  // Validation function
  const validateForm = (): string[] => {
    const errors: string[] = []

    // Required fields validation
    if (!formData.name?.trim()) {
      errors.push("Le nom du client est obligatoire")
    }

    if (!formData.phone?.trim()) {
      errors.push("Le téléphone principal est obligatoire")
    }

    if (!selectedWilaya) {
      errors.push("La wilaya est obligatoire")
    }

    if (!formData.commune?.trim()) {
      errors.push("La commune est obligatoire")
    }

    if (!formData.address?.trim()) {
      errors.push("L'adresse est obligatoire")
    }

    if (!formData.deliveryType) {
      errors.push("Le type de livraison est obligatoire")
    }

    if (!formData.deliveryCompany) {
      errors.push("L'entreprise de livraison est obligatoire")
    }

    if (!formData.confirmationStatus) {
      errors.push("Le statut de confirmation est obligatoire")
    }

    if (isNew && !formData.source) {
      errors.push("La source est obligatoire pour une nouvelle commande")
    }

    // Articles validation
    if (selectedArticles.length === 0) {
      errors.push("Au moins un article doit être sélectionné")
    }

    // Validate each article
    selectedArticles.forEach((article, articleIndex) => {
      if (!article.name?.trim()) {
        errors.push(`L'article ${articleIndex + 1} doit avoir un nom`)
      }

      if (article.variants.length === 0) {
        errors.push(`L'article ${articleIndex + 1} doit avoir au moins une variante`)
      }

      article.variants.forEach((variant: ArticleVariant, variantIndex: number) => {
        if (variant.quantity <= 0) {
          errors.push(
            `La quantité de la variante ${variantIndex + 1} de l'article ${articleIndex + 1} doit être supérieure à 0`,
          )
        }

        if (variant.price <= 0) {
          errors.push(
            `Le prix de la variante ${variantIndex + 1} de l'article ${articleIndex + 1} doit être supérieur à 0`,
          )
        }

        // Check stock availability
        const availableStock = Array.isArray(variant.depot)
          ? (variant.depot[0]?.quantity ?? 0)
          : (variant.depot?.quantity ?? 0)

        if (variant.quantity > availableStock && availableStock > 0) {
          errors.push(
            `Stock insuffisant pour ${article.name} (${variant.size}, ${variant.color}). Disponible: ${availableStock}, Demandé: ${variant.quantity}`,
          )
        }
      })
    })

    // Delivery validation
    if (formData.deliveryType === "stopdesk" && !formData.deliveryCenter) {
      errors.push("Un point de relais doit être sélectionné pour la livraison en point de relais")
    }

    // Check if stopdesk is available for selected commune
    if (formData.deliveryType === "stopdesk" && formData.commune && !isStopDeskAvailable(formData.commune)) {
      errors.push(`Le service point de relais n'est pas disponible pour ${formData.commune}`)
    }

    // Depot and reference validation
    const hasSelectedDepots = Object.keys(selectedDepots).length > 0
    if (hasSelectedDepots && !isReferenceValid) {
      errors.push("Une référence d'au moins 10 caractères est requise lorsque des dépôts sont sélectionnés")
    }

    // Exchange articles validation
    if (isExchange && exchangeArticles.length === 0) {
      errors.push("Au moins un article d'échange doit être sélectionné pour une commande d'échange")
    }

    return errors
  }

  // Initialiser le formulaire avec les données de la commande
  useEffect(() => {
    const initializeOrderForm = async () => {
      if (order) {
        const cleanedDeliveryPrice =
          typeof order.deliveryPrice === "string"
            ? order.deliveryPrice.replace(/\s?DZD$/, "")
            : order.deliveryPrice?.toString() || "0"

setFormData((prev) => ({
  ...order,
  ...prev, // keeps wilaya, commune, etc.
  deliveryPrice: cleanedDeliveryPrice,
}))

      setSelectedWilaya((prevWilaya) => prevWilaya || order.wilaya)
setCommunes((prevCommunes) =>
  prevCommunes.length === 0 ? getCommunesByWilayaName(order.wilaya) || [] : prevCommunes
)
        setOrderReference(order.orderReference || "")

        const acc: Record<string, Article> = {}

        for (const item of order.articles) {
          const articleId = String(item.product_id)

          if (!acc[articleId]) {
            acc[articleId] = {
              id: articleId,
              name: item.product_name,
              sku: item.product_sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              variants: [],
            }
          }

          // Get variant data from Firestore
          let depot = null
          try {
            const variantRef = doc(db, "Products", articleId, "variants", item.variant_id.toString())
            const variantSnap = await getDoc(variantRef)
            if (variantSnap.exists()) {
              const variantData = variantSnap.data()
              depot = variantData?.depots?.[0] || null
            }
          } catch (err) {
            console.error(`Error fetching depot for variant ${item.variant_id}`, err)
          }

          acc[articleId].variants.push({
            id: `variant-${item.variant_id}`,
            size: item.variant_options.option1,
            color: item.variant_options.option2,
            quantity: item.quantity,
            price: Number.parseFloat(item.unit_price),
            stockStatus: "available",
            ...item,
            depot: item.depot || depot,
          })
        }

        setSelectedArticles(Object.values(acc))
      } else {
        // Defaults for new order
        const newOrderId = `CMD-${Math.floor(1000 + Math.random() * 9000)}`
        const today = new Date().toLocaleDateString("fr-FR")

        setFormData({
          id: newOrderId,
          status: "en-attente",
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

      // Fetch previous orders for exchange
      const deliveredOrders = getOrdersByStatus("Livrés")
      setPreviousOrders(deliveredOrders)
    }

    initializeOrderForm()
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
  const handleChange = async (field: keyof Order, value: any) => {
      if (["name", "phone"].includes(field)) {
    return;
  }
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      if (value === "Confirmé") {
        updated.status = "Confirmé"
      }

      return updated
    })

const wilayaRaw = field === "wilaya" ? value : formData.wilayaCode;
const type = field === "deliveryType" ? value : formData.deliveryType;

const wilaya = wilayaRaw?.toString().padStart(2, '0');

if (wilaya && type) {
  try {
   
    
    const docRef = doc(db, "deliveryPrices", wilaya);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const price = snap.data()[type]; // "domicile" or "stopdesk"
      setFormData((prev) => ({ ...prev, deliveryPrice: price || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, deliveryPrice: 0 }));
    }
  } catch (err) {
    console.error("Error fetching delivery price:", err);
    setFormData((prev) => ({ ...prev, deliveryPrice: 0 }));
  }
}

    // Clear validation errors when user makes changes
    setValidationErrors([])
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

  const updateArticle = (articleId: string, field: keyof Article, value: any) => {
    if (field === "id") {
      const inventoryItem = products?.find((product) => product.id === value)

      setSelectedArticles(
        selectedArticles.map((article) => {
          if (article.id === articleId) {
            if (inventoryItem) {
              // 🔍 Find matching option sets
              const sizeOption = inventoryItem.options?.find((opt) =>
                ["Pointure", "pointure", "Taille"].includes(opt.name),
              )
              const otherOption = inventoryItem.options?.find((opt) => opt.name !== sizeOption?.name)

              const defaultSize = sizeOption?.values?.[0] ?? null
              const defaultColor = otherOption?.values?.[0] ?? null

              const updatedVariants = inventoryItem.variants.map((invVariant) => {
                const baseVariant = {
                  id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  quantity: 1,
                  price: invVariant.price,
                  unit_price: invVariant.unit_price,
                  inventoryVariantId: invVariant.id,
                  variant_id: invVariant.id,
                  availableStock: "0",
                  stockStatus: "available",
                  expectedDate: "",
                  size: defaultSize,
                  color: defaultColor,
                  depot: invVariant.depots ?? [],
                }

                return baseVariant
              })

              const validVariant = updatedVariants.find((v) => v?.depot?.[0])
              const variantKey = `${articleId}-${validVariant?.variantId}`

              setSelectedDepots((prev) => {
                const updated = {
                  ...prev,
                  [variantKey]: validVariant?.depot?.[0] ?? null,
                }

                // Call generateReference with the updated depots
                generateReference(updated)

                return updated
              })

              return {
                ...article,
                ...inventoryItem,
                [field]: value,
                name: inventoryItem.title,
                sku: inventoryItem.sku,
                variants: validVariant ? [validVariant] : [], // Use the found variant or empty array
              }
            } else {
              return { ...article, [field]: value }
            }
          }
          return article
        }),
      )
    } else {
      setSelectedArticles(
        selectedArticles.map((article) => (article.id === articleId ? { ...article, [field]: value } : article)),
      )
    }
  }
//console.log(formData);

  // Ajouter une variante à un article
  const addVariant = (articleId: string) => {
    setSelectedArticles(
      selectedArticles.map((article) => {
        if (article.id === articleId) {
          const product = products.find((p) => p.id === article.id)

          // Find options
          const sizeOption = product?.options?.find((opt) => ["Pointure", "pointure", "Taille"].includes(opt.name))
          const otherOption = product?.options?.find((opt) => opt.name !== sizeOption?.name)

          const defaultSize = sizeOption?.values?.[0] ?? null
          const defaultColor = otherOption?.values?.[0] ?? null

          const newVariant = {
            id: `variant-${articleId}-${article.variants.length}`,
            size: defaultSize,
            color: defaultColor,
            quantity: 1,
            price: product?.variants?.[0]?.price || 0,
            stockStatus: "available",
            depot: product?.variants?.[0]?.depots || [],
          }

          return {
            ...article,
            variants: [...article.variants, newVariant],
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
    setSelectedArticles((prevArticles) =>
      prevArticles.map((article) => {
        if (article.id !== articleId) return article

        const updatedVariants = article.variants.map((variant) => {
          if (variant.id !== variantId) return variant

          const updatedVariant = { ...variant, [field]: value }

          // If size or color changed, try to find matching inventory variant
          if (field === "size" || field === "color") {
            const product = products?.find((p) => p.id === article.id)
            if (product) {
              const matchingInventoryVariant = product.variants.find(
                (invVariant) =>
                  (invVariant.option1 === updatedVariant.size && invVariant.option2 === updatedVariant.color) ||
                  (invVariant.option2 === updatedVariant.size && invVariant.option1 === updatedVariant.color),
              )

              if (matchingInventoryVariant) {
                updatedVariant.variant_id = matchingInventoryVariant.id
                updatedVariant.depot = matchingInventoryVariant.depots[0] || []
              }
            }
          }

          // Keep price/unit_price in sync
          if (field === "price") {
            updatedVariant.unit_price = value
          } else if (field === "unit_price") {
            updatedVariant.price = value
          }

          return updatedVariant
        })

        return { ...article, variants: updatedVariants }
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
          depot: [],
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

  // Calculer le prix total
  const calculateTotalExchangePrice = () => {
    let total = 0
    exchangeArticles.forEach((article) => {
      article.variants.forEach((variant) => {
        total += variant.price * variant.quantity
      })
    })
    return total
  }

  // Add this function after the handleStockCheck function
  const openDepotSelection = (articleId: string, variantId: string) => {
    setCurrentVariantForDepot({ articleId, variantId })
    setShowDepotDialog(true)
  }

  const selectDepotForVariant = (depotId: string) => {
    if (!currentVariantForDepot) return

    const selectedDepot = availableDepots.find((d) => d.id === depotId)
    if (!selectedDepot) return

    const variantKey = `${currentVariantForDepot.articleId}-${currentVariantForDepot.variantId}`

    // Update the selectedDepots state
    setSelectedDepots((prev) => {
      const updated = {
        ...prev,
        [variantKey]: { ...selectedDepot, quantity: 1 },
      }

      // Call generateReference with the updated depots
      generateReference(updated)

      return updated
    })

    // Update the variant with the depot information directly
    setSelectedArticles(
      selectedArticles.map((article) => {
        if (article.id === currentVariantForDepot.articleId) {
          return {
            ...article,
            variants: article.variants.map((variant) => {
              if (variant.variant_id === currentVariantForDepot.variantId) {
                return {
                  ...variant,
                  depot: { ...selectedDepot, quantity: 1 },
                }
              }
              return variant
            }),
          }
        }
        return article
      }),
    )

    setShowDepotDialog(false)
  }

  const generateReference = (depotsObj = selectedDepots) => {
    if (!depotsObj || typeof depotsObj !== "object") {
      setOrderReference("")
      setIsReferenceValid(false)
      return
    }

    const depots = Object.values(depotsObj)

    console.log("depots", depots)

    if (depots.length === 0) {
      setOrderReference("")
      setIsReferenceValid(false)
      return
    }

    const allSameDepot = depots.every((d) => d?.id === depots[0]?.id)

    let prefix = ""
    if (allSameDepot) {
      prefix = depots[0]?.name?.substring(0, 5)?.toUpperCase() || "DEPOT"
    } else {
      prefix = "DEPOTD"
    }

    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    const timestamp = Date.now().toString().substring(9, 13)

    const newReference = `${prefix}-${randomStr}${timestamp}`
    setOrderReference(newReference)
    setIsReferenceValid(newReference.length >= 10)
  }

  const { workerName } = useAuth()

  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    // Validate form
    const errors = validateForm()
    // 📞 Check if phone number is valid (basic regex: starts with 0 and has 10 digits)
  const phoneRegex = /^0\d{9}$/ // e.g., 0555123456
  if (!phoneRegex.test(formData.phone)) {
    toast({
      title: "Numéro invalide",
      description: "Veuillez entrer un numéro de téléphone valide (ex: 0555123456).",
      variant: "destructive",
    })
    return
  }
    if (errors.length > 0) {
      setValidationErrors(errors)
      toast({
        title: "Erreurs de validation",
        description: `${errors.length} erreur(s) détectée(s). Veuillez corriger les champs manquants.`,
        variant: "destructive",
      })
      return
    }
  
    // Check if deliveryPrice is 0 but freeDelivery is not enabled
    const freeDelivery = formData.freeDelivery ?? false
    const deliveryPrice = Number(formData.deliveryPrice ?? 0)
  
    if (!freeDelivery && deliveryPrice === 0) {
      toast({
        title: "Prix de livraison invalide",
        description: "Le prix de livraison ne peut pas être 0 sauf si la livraison est gratuite.",
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
    const totalPrice =
      calculateTotalPrice() + deliveryPrice - calculateTotalExchangePrice() || 0
  
    // Update the articles and total price
    const updatedFormData = {
      ...formData,
      sku: formData.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      wilaya: selectedWilaya,
      totalPrice: totalPrice,
      orderReference: orderReference,
      articles: selectedArticles.flatMap((article) =>
        article.variants.map((variant) => {
          const variantKey = `${article.id}-${variant.id}`
          const selectedDepot = selectedDepots[variantKey]
  
          return {
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
            depotId:
              selectedDepot?.id ??
              (Array.isArray(variant.depot)
                ? variant.depot[0]?.id
                : variant.depot?.id),
            depotName:
              selectedDepot?.name ??
              (Array.isArray(variant.depot)
                ? variant.depot[0]?.name
                : variant.depot?.name),
          }
        }),
      ),
    }
  
    const cleanedExchangeArticles = (exchangeArticles || []).map((article) => {
      const cleaned = {}
      for (const key in article) {
        cleaned[key] = article[key] === undefined ? "" : article[key]
      }
      return cleaned
    })
  
    const enrichedFormData = {
      ...updatedFormData,
      ...(isExchange &&
        cleanedExchangeArticles.length > 0 && {
          exchangeArticles: cleanedExchangeArticles,
          isExchange: true,
        }),
      createdAt: isNew ? new Date() : updatedFormData.createdAt,
    }
    console.log(updatedFormData);
    
    if (isNew) {
      addOrder({
        ...enrichedFormData,
        confirmatrice: workerName ? workerName : "",
      })
  
      console.log(enrichedFormData)
  
      toast({
        title: "Commande ajoutée",
        description: `La commande ${updatedFormData.id} a été ajoutée avec succès.`,
      })
    } else {
      updateOrder(order!.id, enrichedFormData)
  
      toast({
        title: "Commande mise à jour",
        description: `La commande ${order!.id} a été mise à jour avec succès.`,
      })
    }
  
    // Clear validation errors on successful submit
    setValidationErrors([])
    onOpenChange(false)
    setOrder(undefined) // Reset order state after submission
  }

  // Modified function to check if a variant needs a depot
  const variantNeedsDepot = (variant: ArticleVariant) => {
    if (!variant.depot) return false
    console.log("var ", variant.depot)

    if (Array.isArray(variant.depot)) {
      return variant.depot.length > 0 && variant.depot[0]?.quantity === 0
    }

    return variant.depot.quantity === 0
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
    if (field === "id") {
      const inventoryItem = products?.find((product) => product.id === value)

      setExchangeArticles(
        exchangeArticles.map((article) => {
          if (article.id === articleId) {
            if (inventoryItem) {
              // 🔍 Find matching option sets
              const sizeOption = inventoryItem.options?.find((opt) =>
                ["Pointure", "pointure", "Taille"].includes(opt.name),
              )
              const otherOption = inventoryItem.options?.find((opt) => opt.name !== sizeOption?.name)

              const defaultSize = sizeOption?.values?.[0] ?? null
              const defaultColor = otherOption?.values?.[0] ?? null

              const updatedVariants = inventoryItem.variants.map((invVariant) => {
                const baseVariant = {
                  id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  quantity: 1,
                  price: invVariant.price,
                  unit_price: invVariant.unit_price || invVariant.price,
                  inventoryVariantId: invVariant.id,
                  variant_id: invVariant.id,
                  availableStock: "0",
                  stockStatus: "available",
                  expectedDate: "",
                  size: defaultSize,
                  color: defaultColor,
                }

                return baseVariant
              })

              return {
                ...article,
                ...inventoryItem,
                [field]: value,
                name: inventoryItem.title,
                sku: inventoryItem.sku,
                variants: [updatedVariants[0]], // Use the found variant or empty array
              }
            } else {
              return { ...article, [field]: value }
            }
          }
          return article
        }),
      )
    } else {
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
          const product = products.find((p) => p.id === article.id)

          // Find options
          const sizeOption = product?.options?.find((opt) => ["Pointure", "pointure", "Taille"].includes(opt.name))
          const otherOption = product?.options?.find((opt) => opt.name !== sizeOption?.name)

          const defaultSize = sizeOption?.values?.[0] ?? null
          const defaultColor = otherOption?.values?.[0] ?? null

          const newVariant = {
            id: `variant-${articleId}-${article.variants.length}`,
            size: defaultSize,
            color: defaultColor,
            quantity: 1,
            price: product?.variants?.[0]?.price || 0,
            stockStatus: "available",
          }

          return {
            ...article,
            variants: [...article.variants, newVariant],
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
    setExchangeArticles((prevArticles) =>
      prevArticles.map((article) => {
        if (article.id !== articleId) return article

        const updatedVariants = article.variants.map((variant) => {
          if (variant.id !== variantId) return variant

          const updatedVariant = { ...variant, [field]: value }

          // If size or color changed, try to find matching inventory variant
          if (field === "size" || field === "color") {
            const product = products?.find((p) => p.id === article.id)
            if (product) {
              const matchingInventoryVariant = product.variants.find(
                (invVariant) =>
                  (invVariant.option1 === updatedVariant.size && invVariant.option2 === updatedVariant.color) ||
                  (invVariant.option2 === updatedVariant.size && invVariant.option1 === updatedVariant.color),
              )

              if (matchingInventoryVariant) {
                updatedVariant.variant_id = matchingInventoryVariant.id
              }
            }
          }

          // Keep price/unit_price in sync
          if (field === "price") {
            updatedVariant.unit_price = value
          } else if (field === "unit_price") {
            updatedVariant.price = value
          }

          return updatedVariant
        })

        return { ...article, variants: updatedVariants }
      }),
    )
  }
useEffect(() => {
  if (!open) {
    setFormData({})
    setSelectedArticles([])
    setExchangeArticles([])
    setSelectedWilaya("")
    setCommunes([])
    setOrderReference("")
    setSelectedDepots({})
    setValidationErrors([])
    setIsExchange(false)
    setIsRestockMode(false)
    setSelectedPreviousOrder("")
    setShowDepotDialog(false)
    setCurrentVariantForDepot(null)
  }
}, [open])

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

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreurs de validation ({validationErrors.length})</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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
                          {variant.size !== null && (
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
                                  {(() => {
                                    const product = products?.find((p) => p.id === article.id)
                                    if (!product) return null

                                    const sizeOption = product.options.find((opt) =>
                                      ["Pointure", "pointure", "Taille"].includes(opt.name),
                                    )
                                    const colorOption = product.options.find((opt) => opt.name === "Couleur")

                                    const useSizeValues = sizeOption?.values.includes(variant.size)

                                    const valuesToShow = useSizeValues ? sizeOption?.values : colorOption?.values

                                    return valuesToShow?.map((value: string) => (
                                      <SelectItem key={value} value={value}>
                                        {value}
                                      </SelectItem>
                                    ))
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Couleur Select */}
                          {variant.color !== null && (
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
                                  {(() => {
                                    const product = products?.find((p) => p.id === article.id)
                                    if (!product) return null

                                    const colorOption = product.options.find((opt) =>
                                      ["Couleur", "couleur"].includes(opt.name),
                                    )
                                    const sizeOption = product.options.find((opt) =>
                                      ["Pointure", "pointure", "Taille"].includes(opt.name),
                                    )

                                    const useColorValues = colorOption?.values.includes(variant.color)

                                    const valuesToShow = useColorValues ? colorOption?.values : sizeOption?.values

                                    return valuesToShow?.map((value: string) => (
                                      <SelectItem key={value} value={value}>
                                        {value}
                                      </SelectItem>
                                    ))
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

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
                              {Array.isArray(variant.depot)
                                ? (variant.depot[0]?.quantity ?? 0)
                                : (variant.depot?.quantity ?? 0)}
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

                          {/* Modified depot column to check for zero quantity */}
                          <div className="space-y-1">
                            <Label htmlFor={`variant-depot-${variant.id}`} className="text-xs">
                              Dépôt
                            </Label>
                            <div>
                              {variantNeedsDepot(variant) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDepotSelection(article.id, variant.variant_id)}
                                  className="h-8 text-xs bg-red-900/20 border-red-700 text-red-400 hover:bg-red-800/30"
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Stock épuisé
                                </Button>
                              ) : variant.depot ? (
                                <div className="flex items-center h-8 text-xs">
                                  <Warehouse className="h-3 w-3 mr-1 text-green-400" />
                                  <span className="text-sm text-muted-foreground text-green-400">
                                    {Array.isArray(variant.depot)
                                      ? (variant.depot[0]?.name ?? "")
                                      : (variant.depot?.name ?? "")}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center h-8 text-xs text-slate-400">
                                  <Warehouse className="h-3 w-3 mr-1" />
                                  Aucun dépôt
                                </div>
                              )}
                            </div>
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
                            {variant.size !== null && (
                              <div className="space-y-1">
                                <Label htmlFor={`variant-size-${variant.id}`} className="text-xs">
                                  Taille
                                </Label>
                                <Select
                                  value={variant.size}
                                  onValueChange={(value) =>
                                    updateExchangeVariant(article.id, variant.id, "size", value)
                                  }
                                >
                                  <SelectTrigger
                                    id={`variant-size-${variant.id}`}
                                    className="h-8 text-xs bg-slate-800/50 border-slate-700"
                                  >
                                    <SelectValue placeholder="Taille" />
                                  </SelectTrigger>

                                  <SelectContent className="bg-slate-900 border-slate-800">
                                    {(() => {
                                      const product = products?.find((p) => p.id === article.id)
                                      if (!product) return null

                                      const sizeOption = product.options.find((opt) =>
                                        ["Pointure", "pointure", "Taille"].includes(opt.name),
                                      )
                                      const colorOption = product.options.find((opt) => opt.name === "Couleur")

                                      const useSizeValues = sizeOption?.values.includes(variant.size)

                                      const valuesToShow = useSizeValues ? sizeOption?.values : colorOption?.values

                                      return valuesToShow?.map((value: string) => (
                                        <SelectItem key={value} value={value}>
                                          {value}
                                        </SelectItem>
                                      ))
                                    })()}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Couleur Select */}
                            {variant.color !== null && (
                              <div className="space-y-1">
                                <Label htmlFor={`variant-color-${variant.id}`} className="text-xs">
                                  Couleur
                                </Label>
                                <Select
                                  value={variant.color}
                                  onValueChange={(value) =>
                                    updateExchangeVariant(article.id, variant.id, "color", value)
                                  }
                                >
                                  <SelectTrigger
                                    id={`variant-color-${variant.id}`}
                                    className="h-8 text-xs bg-slate-800/50 border-slate-700"
                                  >
                                    <SelectValue placeholder="Couleur" />
                                  </SelectTrigger>

                                  <SelectContent className="bg-slate-900 border-slate-800">
                                    {(() => {
                                      const product = products?.find((p) => p.id === article.id)
                                      if (!product) return null

                                      const colorOption = product.options.find((opt) =>
                                        ["Couleur", "couleur"].includes(opt.name),
                                      )
                                      const sizeOption = product.options.find((opt) =>
                                        ["Pointure", "pointure", "Taille"].includes(opt.name),
                                      )

                                      const useColorValues = colorOption?.values.includes(variant.color)

                                      const valuesToShow = useColorValues ? colorOption?.values : sizeOption?.values

                                      return valuesToShow?.map((value: string) => (
                                        <SelectItem key={value} value={value}>
                                          {value}
                                        </SelectItem>
                                      ))
                                    })()}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

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
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`exchange-variant-price-${variant.id}`} className="text-xs">
                                Prix unitaire (DA)
                              </Label>
                              <Input
                                id={`exchange-variant-price-${variant.id}`}
                                type="number"
                                min="0"
                                value={variant.unit_price || variant.price}
                                onChange={(e) => {
                                  const newPrice = Number.parseInt(e.target.value) || 0
                                  updateExchangeVariant(article.id, variant.id, "unit_price", newPrice)
                                  updateExchangeVariant(article.id, variant.id, "price", newPrice)
                                }}
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
                  value={formData.wilayaCode || formData.wilaya}
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
  value={JSON.stringify({ id: formData.commune_id, namefr: formData.commune })}
  onValueChange={(value) => {
    const { id, namefr } = JSON.parse(value);
    handleChange("commune", namefr);
    handleChange("commune_id", id);         
  }}
  disabled={!selectedWilaya}
>
  <SelectTrigger id="commune" className="bg-slate-800/50 border-slate-700">
    <SelectValue placeholder="Sélectionner une commune" />
  </SelectTrigger>
  <SelectContent className="bg-slate-900 border-slate-800">
    {getCommunesByWilayaName(selectedWilaya)
      .map((commune) => ({
        id: commune.id,
        namefr: commune.name,
        namear: commune.name,
        normalizedName: normalizeString(commune.name),
      }))
      .sort((a, b) => a.namefr.localeCompare(b.namefr))
      .map((commune) => {
        const isSelected = normalizeString(commune.namefr) === normalizeString(order?.commune);
        const hasStopDesk = isStopDeskAvailable(commune.namefr);

        return (
          <SelectItem
            key={commune.id}
            value={JSON.stringify({ id: commune.id, namefr: commune.namefr })}
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
        );
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
                    {[...deliveryCompanies, { entity: "deliveryMen" }].map((center) => (
                      <SelectItem key={center?.entity} value={center?.entity}>
                        {center?.entity || "Non défini"}
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
                      {getYalidinCentersForCommune(formData.commune)?.map((desk) => {
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
                  disabled={formData.freeDelivery}
                />

                <div className="flex items-center space-x-2 mt-1">
                  <input
                    id="freeDelivery"
                    type="checkbox"
                    checked={formData.freeDelivery || false}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setFormData((prev) => ({
                        ...prev,
                        confirmationStatus: checked,
                        deliveryPrice: checked ? 0 : prev.deliveryPrice,
                      }))
                    }}
                  />
                  <Label htmlFor="freeDelivery">Livraison gratuite</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calculatedTotalPrice">Prix total calculé (DA)</Label>
                <Input
                  id="calculatedTotalPrice"
                  type="number"
                  value={calculateTotalPrice() + Number(formData.deliveryPrice) - calculateTotalExchangePrice() || 0}
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

        {/* Modified depot selection dialog to show available depots */}
        {showDepotDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-900 p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-medium mb-4">Sélectionner un dépôt</h3>
              <p className="text-sm text-slate-400 mb-4">
                Ce produit est en rupture de stock. Veuillez sélectionner un dépôt pour cette commande.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableDepots.map((depot) => (
                  <div
                    key={depot.id}
                    className="p-3 border border-slate-700 rounded-md hover:bg-slate-800 cursor-pointer"
                    onClick={() => selectDepotForVariant(depot.id)}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{depot.name}</span>
                    </div>
                    <div className="text-xs text-slate-400">Priorité: {depot.priority}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowDepotDialog(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add this before the DialogFooter */}
        {Object.keys(selectedDepots).length > 0 ||
          (orderReference && (
            <div className="mt-6 mb-4">
              <Alert variant="destructive" className="bg-amber-900/20 border-amber-800 text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Articles en rupture de stock</AlertTitle>
                <AlertDescription>
                  Certains articles sont en rupture de stock et nécessitent une référence de dépôt.
                </AlertDescription>
              </Alert>

              <div className="mt-4 p-4 border border-slate-700 rounded-md bg-slate-800/30">
                <h3 className="text-lg font-medium mb-3">Référence de commande</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderReference">Référence (min. 10 caractères) *</Label>
                    <Input
                      id="orderReference"
                      value={orderReference}
                      onChange={(e) => {
                        setOrderReference(e.target.value)
                        setIsReferenceValid(e.target.value.length >= 10)
                      }}
                      className={`bg-slate-800/50 border-${isReferenceValid ? "green" : "red"}-500`}
                    />
                    {!isReferenceValid && (
                      <p className="text-xs text-red-400">La référence doit contenir au moins 10 caractères</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Dépôts sélectionnés</Label>
                    <div className="text-sm text-slate-300 space-y-1">
                      {Object.entries(selectedDepots).map(([key, depot]) => {
                        const [articleId, variantId] = key.split("-")
                        const article = selectedArticles.find((a) => a.id === articleId)
                        const variant = article?.variants.find((v) => v.id === variantId)

                        return (
                          <div key={key} className="flex justify-between">
                            <span>
                              {article?.name} ({variant?.size}, {variant?.color})
                            </span>
                            <span className="text-amber-300">
                              <Warehouse className="h-3 w-3 inline mr-1" />
                              {depot.name}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={confirm}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
          >
            {isNew ? "Ajouter" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
