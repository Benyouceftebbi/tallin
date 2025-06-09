"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
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
  writeBatch,
  where,
  setDoc,
  orderBy,
  getDoc,
} from 'firebase/firestore'
import { useEffect } from 'react'
import { auth, db, functions } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { httpsCallable } from "firebase/functions"
import { useAuth } from "./auth-context"
import { useAppContext } from "./app-context"

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
  | "a modifier"

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
  getWorkerById: (id: string) => any | undefined
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
  const {products}=useAppContext()
// Add a new depot
async function addDepot(depot: Omit<Depot, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "depots"), {
      ...depot,
      createdAt: Timestamp.fromDate(depot.createdAt),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding depot:", error)
    throw error
  }
}

// Get all depots
 async function getDepots(): Promise<Depot[]> {
  try {
    const q = query(collection(db, "depots"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data() 
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        createdAt: (data.createdAt as Timestamp).toDate(),
      }
    })
  } catch (error) {
    console.error("Error getting depots:", error)
    throw error
  }
}

// Get a single depot by ID
 async function getDepot(id: string): Promise<Depot | null> {
  try {
    const docRef = doc(db, "depots", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        createdAt: (data.createdAt as Timestamp).toDate(),
      }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting depot:", error)
    throw error
  }
}

// Update a depot
 async function updateDepot(depot: Depot): Promise<void> {
  if (!depot.id) throw new Error("Depot ID is required for update")

  try {
    const docRef = doc(db, "depots", depot.id)
    await updateDoc(docRef, {
      name: depot.name,
      description: depot.description,
      // Don't update createdAt
    })
  } catch (error) {
    console.error("Error updating depot:", error)
    throw error
  }
}

// Delete a depot
async function deleteDepot(id: string): Promise<void> {
  try {
    const docRef = doc(db, "depots", id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting depot:", error)
    throw error
  }
}

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
        id:  docRef.id,
        idd:  docRef.id, // Ensure id and idd are the same
      }

      // Update local state
      //setOrders((prev) => [...prev, newOrder])

      console.log(`Order added with ID: ${newOrder.id}`)
      return newOrder.id
    } catch (error) {
      console.error("Error adding order:", error)
      throw error
    }
  }

const updateOrder = async (id: string, updatedOrder: Partial<Order>) => {
  try {
    const orderRef = doc(db, "orders", id);
    const currentSnap = await getDoc(orderRef);
    const currentOrder = currentSnap.data() as Order;

    if (!currentOrder) {
      console.error(`Order ${id} not found.`);
      return;
    }

    let finalUpdate: Partial<Order> = { ...updatedOrder };

    // 🔍 Only check for duplicates if setting confirmationStatus to "Confirmé"
    if (
      updatedOrder.confirmationStatus === "Confirmé" &&
      currentOrder.phone
    ) {
     const conflictingStatuses = [
  "Confirmé",
  "En préparation",
  "Dispatcher",
  "En livraison",
];

const ordersRef = collection(db, "orders");
const q = query(ordersRef, where("phone", "==", currentOrder.phone));
const snapshot = await getDocs(q);

const hasOtherConfirmedOrder = snapshot.docs.some((docSnap) => {
  const data = docSnap.data();
  return (
    conflictingStatuses.includes(data.status)
  );
});

      if (hasOtherConfirmedOrder) {
        finalUpdate.confirmationStatus = "Confirmé Double";
      }
    }
    console.log("final",finalUpdate);
    

    // 🕒 Add/update updatedAt timestamp
    await updateDoc(orderRef, {
      ...finalUpdate,
      updatedAt: new Date(),
    });

    // 🔄 Update UI state
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, ...finalUpdate } : order
      )
    );

    console.log(`Order ${id} updated successfully`);
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

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
 const updateMultipleOrdersStatustoEnAttente = async (ids: string[], newStatus: string) => {
    try {
      // Create a batch operation
      const batch = writeBatch(db)

      // Add each order update to the batch
      ids.forEach((id) => {
        const orderRef = doc(db, "orders", id)
        batch.update(orderRef, {
          confirmationStatus: newStatus,
          updatedAt: new Date(),
        })
      })

      // Commit the batch
      await batch.commit()

      // Update local state
      setOrders((prev) =>
        prev.map((order) => (ids.includes(order.id) ? { ...order, confirmationStatus: newStatus as OrderStatus } : order)),
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
  const {userRole, workerName} = useAuth()
  console.log("role",workerName);
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
      // Workers only see counts for orders they confirmed
      if (workerName && order.confirmatrice !== workerName) return
  
      // Count the order by its status
      counts[order.status] = (counts[order.status] || 0) + 1
    })
  
    console.log(counts)
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
const updateConfirmationStatus = async (
  id: string,
  newStatus: ConfirmationStatus,
  changedBy?: string
) => {
  try {
    const conflictingStatuses = ["Confirmé", "En préparation", "Dispatcher", "En livraison"]

    const newHistoryEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      changedBy: changedBy || "System",
    }

    const currentOrder = orders.find((order) => order.id === id)
    const updatedStatusHistory = [...(currentOrder?.statusHistory || []), newHistoryEntry]

    const orderRef = doc(db, "orders", id)

    // If confirming, check for another active order with same phone
    if (newStatus === "Confirmé" && currentOrder?.phone) {
      const q = query(
        collection(db, "orders"),
        where("phone", "==", currentOrder.phone),
        where("status", "in", conflictingStatuses)
      )

      const snapshot = await getDocs(q)

      for (const docSnap of snapshot.docs) {
        const conflictingOrderId = docSnap.id
        if (conflictingOrderId !== id) {
          await updateDoc(doc(db, "orders", conflictingOrderId), {
            confirmationStatus: "Double Confirmé",
            updatedAt: new Date(),
          })
        }
      }
    }

    // Determine Firestore update payload
    let firestoreUpdate: any = {
      confirmationStatus: newStatus,
      statusHistory: updatedStatusHistory,
      updatedAt: new Date(),
    }

    if (newStatus === "Confirmé") {
      firestoreUpdate.status = "Confirmé"
    } else if (newStatus === "Annulé") {
      firestoreUpdate.status = "Annulé"
      firestoreUpdate.confirmationStatus = "Annulé"
    } else {
      firestoreUpdate.status = "en-attente"
    }

    // Update current order
    await updateDoc(orderRef, firestoreUpdate)

    // Update local state
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === id) {
          return {
            ...order,
            confirmationStatus: firestoreUpdate.confirmationStatus,
            status: firestoreUpdate.status,
            statusHistory: updatedStatusHistory,
          }
        }
        if (
          order.phone === currentOrder?.phone &&
          conflictingStatuses.includes(order.status) &&
          order.id !== id
        ) {
          return {
            ...order,
            confirmationStatus: "Double Confirmé",
          }
        }
        return order
      })
    )

    console.log(`✅ Order ${id} confirmation status updated to ${newStatus}`)
  } catch (error) {
    console.error("❌ Error updating confirmation status:", error)
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
const createWorkerUser = httpsCallable(functions, "createWorkerUser");

const result = await createWorkerUser({ email: worker.email, password:worker.password });

    await setDoc(doc(db, 'Workers', result.data.uid), {
      ...worker,
      id: result.data.uid,
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
  const ordersQuery = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    ordersQuery,
    (snapshot) => {
      const addedOrders = snapshot.docChanges()
        .filter(change => change.type === "added")
        .map(change => ({
          ...change.doc.data(),
          id: change.doc.id,
          idd: change.doc.data().id,
        })) as Order[];

      if (addedOrders.length > 0) {
        setOrders(prev => {
          // Merge and sort the result by createdAt descending
          const merged = [...prev, ...addedOrders];

          return merged.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }
    },
    (error) => {
      console.error("Error with order listener:", error);
    }
  );
  

  return () => unsubscribe();
}, []);
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
 const [filters, setFilters] = useState<Filters>({
    dateFilter: "today",
    confirmatrice: "all",
    article: "all",
  })
  
const filteredOrders = useMemo(() => {
  // Wait until orders are loaded
  if (!orders || orders.length === 0) return [];

  let filtered = [...orders];

  // Filter by date
  if (filters.dateFilter === "today") {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    filtered = filtered.filter((order) => {
      const created =
        typeof order?.createdAt?.toDate === "function"
          ? order.createdAt.toDate()
          : new Date(order?.createdAt);

      if (!(created instanceof Date) || isNaN(created.getTime())) return false;

      return (
        created.getFullYear() === y &&
        created.getMonth() === m &&
        created.getDate() === d
      );
    });
  } else if (filters.dateFilter === "yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = yesterday.getMonth();
    const d = yesterday.getDate();

    filtered = filtered.filter((order) => {
      const created =
        typeof order?.createdAt?.toDate === "function"
          ? order.createdAt.toDate()
          : new Date(order?.createdAt);

      if (!(created instanceof Date) || isNaN(created.getTime())) return false;

      return (
        created.getFullYear() === y &&
        created.getMonth() === m &&
        created.getDate() === d
      );
    });
  } else if (filters.dateFilter === "lastweek") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filtered = filtered.filter((order) => {
      const created =
        typeof order?.createdAt?.toDate === "function"
          ? order.createdAt.toDate()
          : new Date(order?.createdAt);

      return created >= weekAgo;
    });
  } else if (filters.dateFilter === "custom" && filters.dateRange) {
    filtered = filtered.filter((order) => {
      const created =
        typeof order?.createdAt?.toDate === "function"
          ? order.createdAt.toDate()
          : new Date(order?.createdAt);

      return (
        created >= filters.dateRange.from && created <= filters.dateRange.to
      );
    });
  }

  // Filter by confirmatrice
  if (filters.confirmatrice !== "all") {
    const selectedWorker = workers.find((w) => w.name === filters.confirmatrice);
    if (selectedWorker) {
      filtered = filtered.filter(
        (order) => order.confirmatrice === selectedWorker.name
      );
    }
  }

  // Filter by article using product titles
  if (filters.article !== "all") {
    const selectedProduct = products.find((p) => p.id === filters.article);
    if (selectedProduct && selectedProduct.title) {
      filtered = filtered.filter(
        (order) =>
          order.article &&
          order.article
            .toLowerCase()
            .includes(selectedProduct.title.toLowerCase())
      );
    }
  }

  return filtered;
}, [orders, filters, workers, products]);
  const getOrdersByStatuss = (status: string, useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders
    return ordersToUse.filter((order) => order.status === status)
  }


  const getOrdersByConfirmatrice = (confirmatrice: string) => {
    if (confirmatrice === "all") return filteredOrders
    return filteredOrders.filter((order) => order.confirmatrice === confirmatrice)
  }

  const getOrdersByDateRange = (startDate: Date, endDate: Date) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.date)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  const getTotalOrders = (useFiltered = true) => {
    return useFiltered ? filteredOrders.length : orders.length
  }

  const getConfirmationRate = (useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders
    const confirmedOrders = ordersToUse.filter(
      (order) => order.status === "Confirmé" || order.status === "En livraison" || order.status === "Livrés",
    ).length
    return ordersToUse.length > 0 ? (confirmedOrders / ordersToUse.length) * 100 : 0
  }

  const getTodayRevenue = (useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders
    const revenueOrders = ordersToUse.filter(
      (order) => order.status === "Confirmé" || order.status === "En livraison" || order.status === "Livrés",
    )
return revenueOrders.reduce((sum, order) => {
  const price = typeof order.totalPrice === "number"
    ? order.totalPrice
    : parseFloat(order.totalPrice); // safely handles "1200 DZD", "999.50", etc.

  return sum + (isNaN(price) ? 0 : price); // fallback if parsing fails
}, 0);  }

  const getStatusDistribution = (useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders
    return [
      { name: "En attente", value: getOrdersByStatus("en-attente", useFiltered).length, color: "#eab308" },
      { name: "Confirmé", value: getOrdersByStatus("Confirmé", useFiltered).length, color: "#22c55e" },
      { name: "En livraison", value: getOrdersByStatus("En livraison", useFiltered).length, color: "#3b82f6" },
      { name: "Livré", value: getOrdersByStatus("Livrés", useFiltered).length, color: "#10b981" },
      { name: "Retour", value: getOrdersByStatus("Retour", useFiltered).length, color: "#ef4444" },
    ]
  }

  const getPerformanceData = (useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders
    return workers
      .map((worker) => {
        const workerOrders = ordersToUse.filter((order) => order.confirmatrice === worker.name)
        const confirmed = workerOrders.filter(
      (order) => order.status === "Confirmé" || order.status === "En livraison" || order.status === "Livrés",
        ).length
        const pending = workerOrders.filter((order) => order.status === "en-attente").length
        const total = workerOrders.length
        const success_rate = total > 0 ? (confirmed / total) * 100 : 0

        return {
          name: worker.name
            .split(" ")
            .map((n) => n.charAt(0).toUpperCase() + n.slice(1, 3))
            .join(" "),
          fullName: worker.name,
          confirmed,
          pending,
          success_rate: Number.parseFloat(success_rate.toFixed(1)),
        }
      })
      .filter((worker) => worker.confirmed > 0 || worker.pending > 0)
  }
  const getArticleData = (useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders

    // Group orders by product titles from the Products collection
    const productGroups = products.reduce(
      (acc, product) => {
        if (product.title) {
          acc[product.title] = []
        }
        return acc
      },
      {} as Record<string, Order[]>,
    )

    // Categorize orders based on product titles
    ordersToUse.forEach((order) => {
      if (order.article) {
        // Find matching product by checking if order article contains product title
        const matchingProduct = products.find(
          (product) => product.title && order.article.toLowerCase().includes(product.title.toLowerCase()),
        )

        if (matchingProduct && productGroups[matchingProduct.title]) {
          productGroups[matchingProduct.title].push(order)
        }
      }
    })

    // Convert to the expected format
    return Object.entries(productGroups)
      .map(([productTitle, categoryOrders]) => {
        const confirmed = categoryOrders.filter(
      (order) => order.status === "Confirmé" || order.status === "En livraison" || order.status === "Livrés",
        ).length
        const returnOrders = categoryOrders.filter((order) => order.status === "retour").length
        const return_rate = categoryOrders.length > 0 ? (returnOrders / categoryOrders.length) * 100 : 0
        const revenue = categoryOrders
          .filter(      (order) => order.status === "Confirmé" || order.status === "En livraison" || order.status === "Livrés")

          .reduce((sum, order) => sum + order.amount, 0)

        return {
          name: productTitle,
          orders: categoryOrders.length,
          confirmed,
          return_rate: Number.parseFloat(return_rate.toFixed(1)),
          revenue,
        }
      })
      .filter((item) => item.orders > 0) // Only show products that have orders
  }

  const getWeeklyData = (useFiltered = true) => {
    const ordersToUse = useFiltered ? filteredOrders : orders
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayOrders = ordersToUse.filter((order) => order.date === date)
      const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
      const dayName = dayNames[new Date(date).getDay()]

      return {
        date: dayName,
        en_attente: dayOrders.filter((o) => o.status === "en-attente").length,
        confirme: dayOrders.filter((o) => o.status === "Confirmé").length,
        en_livraison: dayOrders.filter((o) => o.status === "En livraison").length,
        livre: dayOrders.filter((o) => o.status === "Livrés").length,
        retour: dayOrders.filter((o) => o.status === "Retour").length,
      }
    })
  }
const value = {
  orders,
  inventory,
  workers,
  addOrder,
  updateOrder,
  updateOrderStatus,
  updateMultipleOrdersStatus,
  updateMultipleOrdersStatustoEnAttente,
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
  updateInvoice,
  setOrders,
  addDepot,
  getDepots,
  getDepot,
  updateDepot,
  deleteDepot,
    filteredOrders,
    error,
    filters,
    setFilters,
    getOrdersByConfirmatrice,
    getOrdersByDateRange,
    getTotalOrders,
    getConfirmationRate,
    getTodayRevenue,
    getStatusDistribution,
    getPerformanceData,
    getArticleData,
    getWeeklyData,
    getOrdersByStatuss ,
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

