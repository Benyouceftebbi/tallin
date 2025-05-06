"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getFirestore,
  getDocs,
} from 'firebase/firestore'
import { useEffect } from 'react'
import { db } from "@/lib/firebase"

// Types
export type OrderStatus =
  | "en-attente"
  | "confirmes"
  | "en-preparation"
  | "dispatcher"
  | "en-livraison"
  | "livres"
  | "retour"
  |  "Confirmé"

export type RetourType = "Retour" | "Retour chez le vendeur" | "Retour encaissé"

export type ConfirmationStatus =
  | "En attente"
  | "Confirmé"
  | "Annulé"
  | "Reporté"
  | "Double"
  | "Ne répond pas 1"
  | "Ne répond pas 2"
  | "Ne répond pas 3"

export type DeliveryType = "Domicile" | "Point de relais" | "Express"

export type SmsStatus = "Envoyé" | "Non envoyé" | "Échec"
// Types
export type DeliveryCompany = {
  id: string
  name: string
  companyId: string
  email?: string
  apiId?: string
  apiToken?: string
  webhookUrl?: string
  webhookName?: string
  phone?: string
}


export type StockStatus = "available" | "out_of_stock" | "coming_soon"

export type Order = {
  id: string
  trackingId: string
  name: string
  phone: string
  status: OrderStatus
  smsStatus: SmsStatus
  deliveryType: DeliveryType
  wilaya: string
  commune: string
  address: string
  articles: string
  prix: number
  date: string
  confirmer?: string
  preparer?: string
  deliveryCompany: string
  adresse?: string
  prixLivraison?: number
  lastUpdated: string
  deliveryInformation?: string
  pickupPoint?: string
  confirmationStatus?: ConfirmationStatus
  retourType?: RetourType
  deliveryPrice: number
  totalPrice: number
  source: string
  additionalInfo?: string
}

export type InventoryItem = {
  id: string
  name: string
  description: string
  variants: {
    id: string
    name: string
    price: number
    stock: number
  }[]
  createdAt: Date
  updatedAt: Date
}

export type WorkerRole = "Livreur" | "Préparateur" | "Confirmatrice" | "Dispatcher" | "Admin"

export type PaymentStructureType = "fixed" | "percentage"

export type PaymentStructure = {
  type: PaymentStructureType
  amount: number
}

export type CommissionStructure = {
  type: PaymentStructureType
  amount: number
  threshold?: number
  thresholdType?: "orders" | "amount"
}

export type Worker = {
  id: string
  name: string
  phone: string
  role: WorkerRole
  active: boolean
  joinDate: string
  paymentStructure: PaymentStructure
  commission?: CommissionStructure
  notes?: string
}

type ShopContextType = {
  orders: Order[]
  inventory: InventoryItem[]
  workers: Worker[]
  addOrder: (order: Order) => void
  updateOrder: (id: string, updatedOrder: Partial<Order>) => void
  updateOrderStatus: (id: string, newStatus: string) => void
  updateMultipleOrdersStatus: (ids: string[], newStatus: string) => void
  updateRetourStatus: (id: string, newRetourType: string) => void
  getOrdersByStatus: (status: string | "all") => Order[]
  getOrderById: (id: string) => Order | undefined
  getStatusCounts: () => Record<string, number>
  sendSmsReminder: (id: string) => void
  loading: boolean
  updateConfirmationStatus: (id: string, newStatus: ConfirmationStatus) => void
  getInventoryItem: (name: string) => InventoryItem | undefined
  updateInventoryStock: (itemId: string, variantId: string, quantity: number) => void
  addWorker: (worker: Omit<Worker, "id" | "createdAt" | "updatedAt">) => void
  updateWorker: (id: string, worker: Partial<Worker>) => void
  deleteWorker: (id: string) => void
  getWorkerById: (id: string) => Worker | undefined
}
export type DeliveryMan = {
  id: string
  name: string
  email: string
  startDate: string
  phone?: string
  address?: string
  companies: string[]
}

export type AvailableCompany = {
  id: string
  label: string
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)
// Available delivery companies for selection
export const AVAILABLE_COMPANIES: AvailableCompany[] = [
  { id: "yalidine", label: "Yalidine" },
  { id: "dhl", label: "DHL" },
  { id: "fedex", label: "FedEx" },
  { id: "ups", label: "UPS" },
  { id: "chronopost", label: "Chronopost" },
]

export function ShopProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])


  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(false)
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([])
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([])
  const addOrder = (order: Order) => {
    setOrders((prev) => [...prev, order])
  }

  const updateOrder = (id: string, updatedOrder: Partial<Order>) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updatedOrder } : order)))
  }

  const updateOrderStatus = (id: string, newStatus: string) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: newStatus as OrderStatus } : order)))
  }

  const updateMultipleOrdersStatus = (ids: string[], newStatus: string) => {
    setOrders((prev) =>
      prev.map((order) => (ids.includes(order.id) ? { ...order, status: newStatus as OrderStatus } : order)),
    )
  }

  const updateRetourStatus = (id: string, newRetourType: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, retourType: newRetourType as RetourType } : order)),
    )
  }

  const getOrdersByStatus = (status: string | "all") => {
    if (status === "all") return orders
    return orders.filter((order) => order.status === status)
  }

  const getOrderById = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      "en-attente": 0,
      "Confirmé": 0,
      "en-preparation": 0,
      dispatcher: 0,
      "en-livraison": 0,
      livres: 0,
      retour: 0,
    }

    orders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1
    })
console.log(counts);

    return counts
  }

  const sendSmsReminder = (id: string) => {
    // Simulate SMS sending
    setLoading(true)
    setTimeout(() => {
      console.log(`SMS reminder sent for order ${id}`)
      setLoading(false)
    }, 1000)
  }

  const updateConfirmationStatus = (id: string, newStatus: ConfirmationStatus, changedBy ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
  
        const newHistoryEntry = {
          status: newStatus,
          timestamp: new Date().toISOString(),
          changedBy:changedBy?changedBy:"System",
        };
  
        return {
          ...order,
          confirmationStatus: newStatus,
          status:"Confirmé",
          statusHistory: [...(order.statusHistory || []), newHistoryEntry],
        };
      })
    );
  };

  const getInventoryItem = (name: string) => {
    return inventory.find((item) => item.name === name)
  }

  const updateInventoryStock = (itemId: string, variantId: string, quantity: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            variants: item.variants.map((variant) => {
              if (variant.id === variantId) {
                return {
                  ...variant,
                  stock: variant.stock + quantity,
                }
              }
              return variant
            }),
            updatedAt: new Date(),
          }
        }
        return item
      }),
    )
  }

  const addWorker = async (worker: Omit<Worker, "id" | "createdAt" | "updatedAt">) => {

    await addDoc(collection(db, 'Workers'), {
      ...worker,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  const updateWorker = async (id: string, updatedWorker: Partial<Worker>) => {
    const workerRef = doc(db, 'Workers', id)
    await updateDoc(workerRef, {
      ...updatedWorker,
      updatedAt: new Date(),
    })
  }

  const deleteWorker = async (id: string) => {
    const workerRef = doc(db, 'Workers', id)
    await deleteDoc(workerRef)
  }

  const getWorkerById = (id: string) => {
    return workers.find((worker) => worker.id === id)
  }
  const addDeliveryCompany = async (company: Omit<DeliveryCompany, "id">) => {
    await addDoc(collection(db, 'deliveryCompanies'), company)
  }
  
  const updateDeliveryCompany = async (id: string, company: Partial<DeliveryCompany>) => {
    const ref = doc(db, 'deliveryCompanies', id)
    await updateDoc(ref, company)
  }
  
  const deleteDeliveryCompany = async (id: string) => {
    const ref = doc(db, 'deliveryCompanies', id)
    await deleteDoc(ref)
  }

  // Delivery man operations
  const addDeliveryMan = async (man: Omit<DeliveryMan, "id">) => {
    await addDoc(collection(db, 'deliveryMen'), man)
  }
  
  const updateDeliveryMan = async (id: string, man: Partial<DeliveryMan>) => {
    const ref = doc(db, 'deliveryMen', id)
    await updateDoc(ref, man)
  }
  
  const deleteDeliveryMan = async (id: string) => {
    const ref = doc(db, 'deliveryMen', id)
    await deleteDoc(ref)
  }
  const value = {
    orders,
    inventory,
    workers,
    addOrder,
    updateOrder,
    updateOrderStatus,
    updateMultipleOrdersStatus,
    updateRetourStatus,
    getOrdersByStatus,
    getOrderById,
    getStatusCounts,
    sendSmsReminder,
    loading,
    updateConfirmationStatus,
    getInventoryItem,
    updateInventoryStock,
    addWorker,
    updateWorker,
    deleteWorker,
    getWorkerById,
    deliveryCompanies,
    deliveryMen,
    availableCompanies: AVAILABLE_COMPANIES,
    addDeliveryCompany,
    updateDeliveryCompany,
    deleteDeliveryCompany,
    addDeliveryMan,
    updateDeliveryMan,
    deleteDeliveryMan,
  }
useEffect(()=>{
  const unsubscribeWorkers = onSnapshot(collection(db, 'Workers'), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('Worker added:', change.doc.data())
      }
      if (change.type === 'modified') {
        console.log('Worker modified:', change.doc.data())
      }
      if (change.type === 'removed') {
        console.log('Worker removed:', change.doc.data())
      }
    })
  
    const workersData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Worker[]
    setWorkers(workersData)
  })
  const unsubscribeDeliveryCompanies = onSnapshot(collection(db, 'deliveryCompanies'), (snapshot) => {
    const deliveryCompaniesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DeliveryCompany[]
    setDeliveryCompanies(deliveryCompaniesData)
  })
  const unsubscribeDeliveryMen = onSnapshot(collection(db, 'deliveryMen'), (snapshot) => {
    const deliveryMenData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DeliveryMan[]
    setDeliveryMen(deliveryMenData)
  })
  return () => {
    unsubscribeWorkers()
    unsubscribeDeliveryCompanies()
    unsubscribeDeliveryMen()
  }
},[])
useEffect(() => {
  const fetchOrders = async () => {
    try {
      const ordersCollection = await getDocs(collection(db,'orders')) ;
      const ordersData = ordersCollection.docs.map(doc => doc.data() as Order);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  fetchOrders();
}, []); // Empty dependency array ensures this effect runs only once on mount
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider")
  }
  return context
}

