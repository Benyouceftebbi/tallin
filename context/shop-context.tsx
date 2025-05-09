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
  Timestamp,
  query,
  limit,
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
  docId?: string
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
  const addOrder = async (order: Order) => {
    try {
      // Add timestamp if not provided
      const orderWithTimestamp = {
        ...order,
        createdAt: order.createdAt || new Date(),
        updatedAt: new Date(),
      }

      // Add to Firestore
      const orderRef = collection(db, "orders")
      const docRef = await addDoc(orderRef, orderWithTimestamp)

      // Add the document ID to the order object if it doesn't have one
      const newOrder = {
        ...orderWithTimestamp,
        id: order.id || docRef.id,
      }

      // Update local state
      setOrders((prev) => [...prev, newOrder])

      console.log(`Order added with ID: ${newOrder.id}`)
      return newOrder.id
    } catch (error) {
      console.error("Error adding order:", error)
      throw error
    }
  }

  const updateOrder = async (id: string, updatedOrder: Partial<Order>) => {
    try {
      // Update in Firestore
      console.log(updatedOrder);
      
      const orderRef = doc(db, "orders", id)
      await updateDoc(orderRef, {
        ...updatedOrder,
        updatedAt: new Date(),
      })

      // Update local state
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, ...updatedOrder } : order)))

      console.log(`Order ${id} updated successfully`)
    } catch (error) {
      console.error("Error updating order:", error)
      throw error
    }
  }

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      // Update in Firestore
      const orderRef = doc(db, "orders", id)
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      })

      // Update local state
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status: newStatus as OrderStatus } : order)),
      )

      console.log(`Order ${id} status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating order status:", error)
      throw error
    }
  }

  const updateMultipleOrdersStatus = async (ids: string[], newStatus: string) => {
    try {
      // Create a batch operation
      const batch = writeBatch(db)

      // Add each order update to the batch
      ids.forEach((id) => {
        const orderRef = doc(db, "orders", id)
        batch.update(orderRef, {
          status: newStatus,
          updatedAt: new Date(),
        })
      })

      // Commit the batch
      await batch.commit()

      // Update local state
      setOrders((prev) =>
        prev.map((order) => (ids.includes(order.id) ? { ...order, status: newStatus as OrderStatus } : order)),
      )

      console.log(`Updated status to ${newStatus} for ${ids.length} orders`)
    } catch (error) {
      console.error("Error updating multiple order statuses:", error)
      throw error
    }
  }

  const updateRetourStatus = async (id: string, newRetourType: string) => {
    try {
      // Update in Firestore
      const orderRef = doc(db, "orders", id)
      await updateDoc(orderRef, {
        retourType: newRetourType,
        updatedAt: new Date(),
      })

      // Update local state
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, retourType: newRetourType as RetourType } : order)),
      )

      console.log(`Order ${id} retour type updated to ${newRetourType}`)
    } catch (error) {
      console.error("Error updating retour status:", error)
      throw error
    }
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

  const updateConfirmationStatus = async (id: string, newStatus: ConfirmationStatus, changedBy) => {
    try {
      // Create the new history entry
      const newHistoryEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        changedBy: changedBy ? changedBy : "System",
      }
if(newStatus=== "Confirmé") {
      // Get the current order to access its statusHistory
      const currentOrder = orders.find((order) => order.id === id)
      const updatedStatusHistory = [...(currentOrder?.statusHistory || []), newHistoryEntry]

      // Update in Firestore
      const orderRef = doc(db, "orders", id)
      await updateDoc(orderRef, {
        confirmationStatus: newStatus,
        status: "Confirmé",
        statusHistory: updatedStatusHistory,
        updatedAt: new Date(),
      })

      // Update local state
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order

          return {
            ...order,
            confirmationStatus: newStatus,
            status: "Confirmé",
            statusHistory: updatedStatusHistory,
          }
        }),
      )
}
else{
      // Get the current order to access its statusHistory
      const currentOrder = orders.find((order) => order.id === id)
      const updatedStatusHistory = [...(currentOrder?.statusHistory || []), newHistoryEntry]

      // Update in Firestore
      const orderRef = doc(db, "orders", id)
      await updateDoc(orderRef, {
        confirmationStatus: newStatus,
        status: "en-attente",
        statusHistory: updatedStatusHistory,
        updatedAt: new Date(),
      })

      // Update local state
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order

          return {
            ...order,
            confirmationStatus: newStatus,
            status: "en-attente",
            statusHistory: updatedStatusHistory,
          }
        }),
      )
}


      console.log(`Order ${id} confirmation status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating confirmation status:", error)
      throw error
    }
  }

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

const ordersQuery = query(collection(db, 'orders'));
const ordersCollection= await getDocs(ordersQuery);
      const ordersData = ordersCollection.docs.map(doc =>( {...doc.data(),id:doc.id,docId:doc.data().id}) as Order);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders: ", error);
    }
  };

  fetchOrders();
}, []); // Empty dependency array ensures this effect runs only once on mount
const [suppliers, setSuppliers] = useState<Supplier[]>([])
const [error, setError] = useState<string | null>(null)
const [isOffline, setIsOffline] = useState<boolean>(false)

// Fonction pour récupérer les fournisseurs depuis Firebase
const fetchSuppliers = async () => {
  try {
    setLoading(true)
    setError(null)

    const suppliersCollection = collection(db, "Suppliers")
    const suppliersSnapshot = await getDocs(suppliersCollection)

    if (suppliersSnapshot.empty) {
      console.log("No suppliers found in Firestore, using initial data")
    } else {
      const suppliersList = suppliersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Supplier[]
      setSuppliers(suppliersList)
    }

  } catch (err) {
    console.error("Error fetching suppliers:", err)
    setError("Impossible de charger les fournisseurs. Utilisation des données locales.")
  } finally {
    setLoading(false)
  }
}
  // Charger les fournisseurs lorsque le composant est ouvert
  useEffect(() => {

      fetchSuppliers()
    
  }, [])
// Fonction pour ajouter un fournisseur
const addSupplier = async (supplierData: Omit<Supplier, "id">): Promise<Supplier> => {
  try {
    setLoading(true)
    setError(null)



    const docRef = await addDoc(collection(db, "Suppliers"), supplierData)
    const newSupplier = { id: docRef.id, ...supplierData } 

    setSuppliers((prev) => [...prev, newSupplier])
    return newSupplier
  } catch (err) {
    console.error("Error adding supplier:", err)
    setError("Impossible d'ajouter le fournisseur. Mode hors ligne activé.")
  } finally {
    setLoading(false)
  }
}

// Fonction pour mettre à jour un fournisseur
const updateSupplier = async (supplier: Supplier): Promise<void> => {
  try {
    setLoading(true)
    setError(null)



    const { id, ...supplierData } = supplier
    const supplierRef = doc(db, "Suppliers", id)
    await updateDoc(supplierRef, supplierData)

    setSuppliers((prev) => prev.map((s) => (s.id === id ? supplier : s)))
  } catch (err) {
    console.error("Error updating supplier:", err)
    setError("Impossible de mettre à jour le fournisseur. Mode hors ligne activé.")
  } finally {
    setLoading(false)
  }
}

// Fonction pour supprimer un fournisseur
const deleteSupplier = async (id: string): Promise<void> => {
  try {
    setLoading(true)
    setError(null)



    await deleteDoc(doc(db, "Suppliers", id))
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
  } catch (err) {
    console.error("Error deleting supplier:", err)
    setError("Impossible de supprimer le fournisseur. Mode hors ligne activé.")

  } finally {
    setLoading(false)
  }
}

const [invoices, setInvoices] = useState<Invoice[]>([]);
useEffect(() => {
  const invoicesRef = collection(db, "invoices");

  // Realtime listener
  const unsubscribe = onSnapshot(invoicesRef, (snapshot) => {
    const invoicesData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];

    setInvoices(invoicesData);
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
const addInvoice = async (invoice: NewInvoice) => {
  try {
    const invoicesRef = collection(db, "invoices");

    const newInvoice = {
      ...invoice,
      createdAt: invoice.createdAt || Timestamp.now(),

    };

    const docRef = await addDoc(invoicesRef, newInvoice);
    
    console.log("Invoice added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding invoice:", error);
    throw error;
  }
};
const updateInvoice = async (updatedInvoice: any) => {
  try {
    // Update Firestore
    const invoiceRef = doc(db, "invoices", updatedInvoice.id);
    await updateDoc(invoiceRef, {
      ...updatedInvoice,
      updatedAt: Timestamp.now(),
    });

    // Optionally update local state
    setInvoices((prev) =>
      (prev || []).map((invoice) =>
        invoice.id === updatedInvoice.id
          ? { ...updatedInvoice, updatedAt: new Date().toISOString() }
          : invoice
      )
    );

    return Promise.resolve();
  } catch (error) {
    console.error("Error updating invoice:", error);
    return Promise.reject(error);
  }
};
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
  suppliers,
  fetchSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  addInvoice,
  invoices,
  updateInvoice
}

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider")
  }
  return context
}

