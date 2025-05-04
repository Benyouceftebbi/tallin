"use client"

import { db } from "@/lib/firebase"
import { collection, getDoc, getDocs } from "firebase/firestore"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Types pour les commandes
export type OrderStatus = "Confirmés" | "En préparation" | "Dispatcher" | "En livraison" | "Livrés" | "Retour"

export type DeliveryType = "Domicile" | "Point de relais" | "Express"

export type SmsStatus = "Envoyé" | "Non envoyé" | "Échec"

export type RetourType = "Retour" | "Retour chez le vendeur" | "Retour encaissé"

// Ajouter le type pour le statut de confirmation
export type ConfirmationStatus =
  | "En attente"
  | "Confirmé"
  | "Annulé"
  | "Reporté"
  | "Double"
  | "Ne répond pas 1"
  | "Ne répond pas 2"
  | "Ne répond pas 3"

// Ajouter le type pour les entreprises de livraison
export type DeliveryCompany = "Yalidin" | "DHL" | "Aramex" | "EMS" | "Autre"

// In the Order type, add a new field for status history
export type StatusHistoryEntry = {
  status: ConfirmationStatus | OrderStatus
  timestamp: string
  changedBy?: string
}

// Mettre à jour le type Order pour inclure les nouveaux champs
export type Order = {
  id: string
  name: string
  phone: string
  phone2?: string // Ajout du second numéro de téléphone
  articles: string
  wilaya: string
  commune: string
  deliveryType: DeliveryType
  pickupPoint?: string
  deliveryPrice: number
  address: string
  additionalInfo?: string
  // Supprimer reference et ajouter deliveryCompany
  // reference: string
  deliveryCompany: DeliveryCompany
  confirmatrice: string
  totalPrice: number
  source: string
  status: OrderStatus
  date: string
  // Ajouter le statut de confirmation
  confirmationStatus?: ConfirmationStatus
  // Champs pour les étapes avancées
  trackingId: string
  smsStatus: SmsStatus
  lastUpdated: string
  deliveryInformation?: string
  // Champ pour le type de retour
  retourType?: RetourType
  // Champ pour indiquer si c'est un échange
  isExchange?: boolean
  previousOrderId?: string
  // Add status history
  statusHistory?: StatusHistoryEntry[]
}

// Add stock status type
export type StockStatus = "available" | "unavailable" | "coming_soon"

// Add the inventory types after the existing types
export type InventoryItem = {
  id: string
  name: string
  sku: string
  variants: InventoryVariant[]
}

export type InventoryVariant = {
  id: string
  size?: string
  color?: string
  stock: number
  price: number
  stockStatus: StockStatus // Add this field
  expectedDate?: string // Add this field for coming soon items
}

// Interface du contexte
interface ShopContextType {
  orders: Order[]
  inventory: InventoryItem[] // Add this line
  addOrder: (order: Order) => void
  updateOrder: (id: string, updatedOrder: Partial<Order>) => void
  updateOrderStatus: (id: string, newStatus: OrderStatus) => void
  updateMultipleOrdersStatus: (ids: string[], newStatus: OrderStatus) => void
  updateRetourStatus: (id: string, newRetourType: RetourType) => void
  getOrdersByStatus: (status: OrderStatus | "all") => Order[]
  getOrderById: (id: string) => Order | undefined
  getStatusCounts: () => Record<OrderStatus, number>
  sendSmsReminder: (id: string) => void
  loading: boolean
  updateConfirmationStatus: (id: string, newStatus: ConfirmationStatus) => void
  getInventoryItem: (name: string) => InventoryItem | undefined // Add this line
  updateInventoryStock: (itemId: string, variantId: string, quantity: number) => void // Add this line
}

// Création du contexte
const ShopContext = createContext<ShopContextType | undefined>(undefined)

// Données simulées pour les commandes
// In the generateOrders function, add status history
const generateOrders = (count = 50): Order[] => {
  const statuses: OrderStatus[] = ["Confirmés", "En préparation", "Dispatcher", "En livraison", "Livrés", "Retour"]
  const deliveryTypes: DeliveryType[] = ["Domicile", "Point de relais", "Express"]
  const smsStatuses: SmsStatus[] = ["Envoyé", "Non envoyé", "Échec"]
  const retourTypes: RetourType[] = ["Retour", "Retour chez le vendeur", "Retour encaissé"]
  const wilayas = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Tlemcen", "Sétif"]
  const communes = [
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
  ]
  const sources = ["Facebook", "Instagram", "Site Web", "Téléphone", "Recommandation"]
  const pickupPoints = [
    "Bureau de poste central",
    "Agence commerciale",
    "Supermarché Carrefour",
    "Station-service",
    "Centre commercial",
    "Boutique partenaire",
  ]
  const confirmatrices = ["Amina", "Fatima", "Leila", "Samira", "Yasmine", "Karima"]
  const deliveryInfos = [
    "Livraison prévue entre 10h et 12h",
    "Client absent lors de la première tentative",
    "Appeler avant la livraison",
    "Livraison reportée à la demande du client",
    "Accès difficile, contacter le client",
    "Paiement par carte accepté",
  ]
  const deliveryCompanies: DeliveryCompany[] = ["Yalidin", "DHL", "Aramex", "EMS", "Autre"]
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

  return Array.from({ length: count }, (_, i) => {
    const deliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)]
    const wilaya = wilayas[Math.floor(Math.random() * wilayas.length)]
    const commune = communes[Math.floor(Math.random() * communes.length)]
    const articleCount = Math.floor(Math.random() * 3) + 1
    const articles = Array.from({ length: articleCount }, (_, j) => `Article ${j + 1}`).join(", ")
    const deliveryPrice = Math.floor(Math.random() * 500) + 200
    const itemsPrice = Math.floor(Math.random() * 2000) + 500
    const totalPrice = itemsPrice + deliveryPrice
    const confirmatrice = confirmatrices[Math.floor(Math.random() * confirmatrices.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const trackingId = `TRK-${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(6, "0")}`
    const smsStatus = smsStatuses[Math.floor(Math.random() * smsStatuses.length)]
    const lastUpdated = new Date(Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000).toLocaleString("fr-FR")
    const deliveryInformation =
      Math.random() > 0.3 ? deliveryInfos[Math.floor(Math.random() * deliveryInfos.length)] : undefined
    const deliveryCompany = deliveryCompanies[Math.floor(Math.random() * deliveryCompanies.length)]
    const confirmationStatus =
      status === "Confirmés" ? confirmationStatuses[Math.floor(Math.random() * confirmationStatuses.length)] : undefined

    // Ajouter le type de retour pour les commandes en retour
    const retourType = status === "Retour" ? retourTypes[Math.floor(Math.random() * retourTypes.length)] : undefined

    // Ajouter un second numéro de téléphone pour certaines commandes
    const phone2 =
      Math.random() > 0.7
        ? `+213 ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        : undefined

    // Ajouter le statut d'échange pour certaines commandes
    const isExchange = Math.random() > 0.9
    const previousOrderId = isExchange ? `CMD-${1000 + Math.floor(Math.random() * (i - 1))}` : undefined

    // Generate random status history
    const historyLength = Math.floor(Math.random() * 3) + 1
    const statusHistory: StatusHistoryEntry[] = []

    for (let j = 0; j < historyLength; j++) {
      const historyStatus =
        j === historyLength - 1
          ? status === "Confirmés"
            ? confirmationStatus
            : status
          : confirmationStatuses[Math.floor(Math.random() * confirmationStatuses.length)]

      const historyDate = new Date(Date.now() - (Math.floor(Math.random() * 72) + j * 24) * 60 * 60 * 1000)

      statusHistory.push({
        status: historyStatus as any,
        timestamp: historyDate.toLocaleString("fr-FR"),
        changedBy: confirmatrices[Math.floor(Math.random() * confirmatrices.length)],
      })
    }

    // Sort history by timestamp (newest first)
    statusHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return {
      id: `CMD-${1000 + i}`,
      name: `Client ${i + 1}`,
      phone: `+213 ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
      phone2: phone2,
      articles: articles,
      wilaya: wilaya,
      commune: commune,
      deliveryType: deliveryType,
      pickupPoint:
        deliveryType === "Point de relais" ? pickupPoints[Math.floor(Math.random() * pickupPoints.length)] : undefined,
      deliveryPrice: deliveryPrice,
      address: `${Math.floor(Math.random() * 100)} Rue ${Math.floor(Math.random() * 50)}, ${commune}, ${wilaya}`,
      additionalInfo: Math.random() > 0.7 ? "Appeler avant la livraison" : undefined,
      // Remplacer reference par deliveryCompany
      // reference: reference,
      deliveryCompany: deliveryCompany,
      confirmatrice: confirmatrice,
      totalPrice: totalPrice,
      source: sources[Math.floor(Math.random() * sources.length)],
      status: status,
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR"),
      confirmationStatus: confirmationStatus,
      trackingId: trackingId,
      smsStatus: smsStatus,
      lastUpdated: lastUpdated,
      deliveryInformation: deliveryInformation,
      retourType: retourType,
      isExchange: isExchange,
      previousOrderId: previousOrderId,
      statusHistory,
    }
  })
}

// Add a function to generate inventory data after the generateOrders function
const generateInventory = (): InventoryItem[] => {
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

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "Unique", "36", "38", "40", "42", "44"]
  const availableColors = ["Noir", "Blanc", "Rouge", "Bleu", "Vert", "Jaune", "Orange", "Rose", "Violet", "Gris"]

  // Generate future dates for coming soon items
  const generateFutureDate = () => {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1) // Random date in the next 30 days
    return futureDate.toLocaleDateString("fr-FR")
  }

  return availableArticles.map((name, index) => {
    const variantCount = Math.floor(Math.random() * 3) + 1
    const variants: InventoryVariant[] = []

    for (let i = 0; i < variantCount; i++) {
      const size =
        name.includes("Smartphone") || name.includes("iPhone") || name.includes("Tablette")
          ? "Unique"
          : availableSizes[Math.floor(Math.random() * availableSizes.length)]

      const color = availableColors[Math.floor(Math.random() * availableColors.length)]

      // Randomly determine stock status
      const randomValue = Math.random()
      let stockStatus: StockStatus
      let stock: number
      let expectedDate: string | undefined

      if (randomValue < 0.2) {
        // 20% chance of being unavailable
        stockStatus = "unavailable"
        stock = 0
      } else if (randomValue < 0.4) {
        // 20% chance of coming soon
        stockStatus = "coming_soon"
        stock = 0
        expectedDate = generateFutureDate()
      } else {
        // 60% chance of being available
        stockStatus = "available"
        stock = Math.floor(Math.random() * 20) + 1 // Random stock between 1 and 20
      }

      variants.push({
        id: `variant-${index}-${i}`,
        size,
        color,
        stock,
        price: Math.floor(Math.random() * 1500) + 500, // Random price between 500 and 2000
        stockStatus,
        expectedDate,
      })
    }

    return {
      id: `item-${index}`,
      name,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      variants,
    }
  })
}

// Provider du contexte
export function ShopProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([]) // Add this line
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate loading delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Generate orders (you can replace with real data)
        const generatedOrders = generateOrders();

        // Fetch inventory from Firebase Firestore
        const productRef =collection(db,'Products');
        const snapshot = await getDocs(productRef);

        const generatedInventory = snapshot.docs.map(doc => {
          const product = doc.data();
          const variants = product.variants.map(variant => ({
            ...variant,
            productId: product.id,
            title: product.title,
            vendor: product.vendor,
            status: product.status,
          }));
          return variants; // Return all variants for each product
        }).flat(); // Flatten the array to get all variants in one array

        setOrders(generatedOrders);
        setInventory(generatedInventory); // Set inventory state with fetched data
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Ajouter une nouvelle commande
  const addOrder = (order: Order) => {
    setOrders((prevOrders) => [...prevOrders, order])
  }

  // Mettre à jour une commande
  const updateOrder = (id: string, updatedOrder: Partial<Order>) => {
    setOrders((prevOrders) => prevOrders.map((order) => (order.id === id ? { ...order, ...updatedOrder } : order)))
  }

  // Add a function to update status history
  const updateOrderStatus = (id: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              status: newStatus,
              lastUpdated: new Date().toLocaleString("fr-FR"),
              statusHistory: [
                {
                  status: newStatus,
                  timestamp: new Date().toLocaleString("fr-FR"),
                  changedBy: "Utilisateur actuel", // In a real app, this would be the current user
                },
                ...(order.statusHistory || []),
              ],
            }
          : order,
      ),
    )
  }

  // Update the confirmation status function to also track history
  const updateConfirmationStatus = (id: string, newStatus: ConfirmationStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === id) {
          // Create a new status history entry
          const newHistoryEntry: StatusHistoryEntry = {
            status: newStatus,
            timestamp: new Date().toLocaleString("fr-FR"),
            changedBy: "Utilisateur actuel", // In a real app, this would be the current user
          }

          // Create or update the status history array
          const updatedStatusHistory = order.statusHistory
            ? [newHistoryEntry, ...order.statusHistory]
            : [newHistoryEntry]

          return {
            ...order,
            confirmationStatus: newStatus,
            lastUpdated: new Date().toLocaleString("fr-FR"),
            statusHistory: updatedStatusHistory,
          }
        }
        return order
      }),
    )
  }

  // Mettre à jour le statut de plusieurs commandes
  const updateMultipleOrdersStatus = (ids: string[], newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        ids.includes(order.id)
          ? {
              ...order,
              status: newStatus,
              lastUpdated: new Date().toLocaleString("fr-FR"),
            }
          : order,
      ),
    )
  }

  // Mettre à jour le type de retour d'une commande
  const updateRetourStatus = (id: string, newRetourType: RetourType) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              retourType: newRetourType,
              lastUpdated: new Date().toLocaleString("fr-FR"),
            }
          : order,
      ),
    )
  }

  // Envoyer un SMS de rappel
  const sendSmsReminder = (id: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === id
          ? {
              ...order,
              smsStatus: "Envoyé",
              lastUpdated: new Date().toLocaleString("fr-FR"),
            }
          : order,
      ),
    )
  }

  // Obtenir les commandes par statut
  const getOrdersByStatus = (status: OrderStatus | "all") => {
    if (status === "all") return orders
    return orders.filter((order) => order.status === status)
  }

  // Obtenir une commande par ID
  const getOrderById = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  // Obtenir le nombre de commandes par statut
  const getStatusCounts = () => {
    const counts = {
      "En attente": 0,
      Confirmés: 0,
      "En préparation": 0,
      Dispatcher: 0,
      "En livraison": 0,
      Livrés: 0,
      Retour: 0,
    }

    orders.forEach((order) => {
      // Special handling for Confirmés and En attente
      if (order.status === "Confirmés") {
        if (order.confirmationStatus === "Confirmé") {
          counts["Confirmés"]++
        } else {
          counts["En attente"]++
        }
      } else {
        counts[order.status]++
      }
    })

    return counts
  }

  // Add inventory management functions
  const getInventoryItem = (name: string) => {
    return inventory.find((item) => item.name === name)
  }

  const updateInventoryStock = (itemId: string, variantId: string, quantity: number) => {
    setInventory((prevInventory) =>
      prevInventory.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            variants: item.variants.map((variant) => {
              if (variant.id === variantId) {
                return {
                  ...variant,
                  stock: Math.max(0, variant.stock - quantity), // Ensure stock doesn't go below 0
                  stockStatus: variant.stock - quantity <= 0 ? "unavailable" : "available",
                }
              }
              return variant
            }),
          }
        }
        return item
      }),
    )
  }

  // Add the new function to the context value
  const value = {
    orders,
    inventory, // Add this line
    addOrder,
    updateOrder,
    updateOrderStatus,
    updateConfirmationStatus, // Add this new function
    updateMultipleOrdersStatus,
    updateRetourStatus,
    getOrdersByStatus,
    getOrderById,
    getStatusCounts,
    sendSmsReminder,
    loading,
    getInventoryItem, // Add this line
    updateInventoryStock, // Add this line
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

// Hook pour utiliser le contexte
export function useShop() {
  const context = useContext(ShopContext)
  if (context === undefined) {
    throw new Error("useShop doit être utilisé à l'intérieur d'un ShopProvider")
  }
  return context
}
