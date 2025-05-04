"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

// Types pour les produits et variantes
export type ProductVariant = {
  id: string
  name: string
  sku: string
  price: number
  cost: number
  stock: number
}

export type Product = {
  id: string
  name: string
  description: string
  category: string
  image: string
  variants: ProductVariant[]
}

// Types pour les mouvements d'inventaire
export type InventoryMovement = {
  id: string
  date: string
  productId: string
  variantId: string
  quantity: number
  type: "in" | "out"
  reason: string
}

// Types pour les transactions de caisse
export type CashTransaction = {
  id: string
  date: string
  amount: number
  type: "in" | "out"
  category: string
  description: string
}

// Types pour les fournisseurs
export type Supplier = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
}

// Types pour les factures d'achat
export type PurchaseInvoiceItem = {
  id: string
  productId: string
  variantId: string
  quantity: number
  unitPrice: number
}

export type PurchaseInvoice = {
  id: string
  date: string
  supplierId: string
  reference: string
  items: PurchaseInvoiceItem[]
  status: "draft" | "confirmed" | "paid"
  totalAmount: number
}

// Types pour les clients
export type Customer = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
}

// Types pour les factures de vente
export type SalesInvoiceItem = {
  id: string
  productId: string
  variantId: string
  quantity: number
  unitPrice: number
}

export type SalesInvoice = {
  id: string
  date: string
  customerId: string
  reference: string
  items: SalesInvoiceItem[]
  status: "draft" | "confirmed" | "paid"
  totalAmount: number
}

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
  description?: string
  variants: PackVariant[]
  combinations: any[]
}

// Type pour le contexte de l'application
type AppContextType = {
  products: Product[]
  setProducts: (products: Product[]) => void
  inventoryMovements: InventoryMovement[]
  setInventoryMovements: (inventoryMovements: InventoryMovement[]) => void
  cashTransactions: CashTransaction[]
  setCashTransactions: (cashTransactions: CashTransaction[]) => void
  suppliers: Supplier[]
  setSuppliers: (suppliers: Supplier[]) => void
  purchaseInvoices: PurchaseInvoice[]
  setPurchaseInvoices: (purchaseInvoices: PurchaseInvoice[]) => void
  customers: Customer[]
  setCustomers: (customers: Customer[]) => void
  salesInvoices: SalesInvoice[]
  setSalesInvoices: (salesInvoices: SalesInvoice[]) => void
  packs: Pack[]
  setPacks: (packs: Pack[]) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, customer: Customer) => void
  deleteCustomer: (id: string) => void
}

// Création du contexte
const AppContext = createContext<AppContextType | undefined>(undefined)

// Données initiales pour les produits
const initialProducts: Product[] = [
  {
    id: "1",
    name: "T-shirt",
    description: "T-shirt en coton de haute qualité",
    category: "Vêtements",
    image: "/classic-plain-tee.png",
    variants: [
      { id: "1-1", name: "Blanc S", sku: "TS-WS", price: 19.99, cost: 8.5, stock: 25 },
      { id: "1-2", name: "Blanc M", sku: "TS-WM", price: 19.99, cost: 8.5, stock: 30 },
      { id: "1-3", name: "Blanc L", sku: "TS-WL", price: 19.99, cost: 8.5, stock: 20 },
      { id: "1-4", name: "Noir S", sku: "TS-BS", price: 19.99, cost: 8.5, stock: 15 },
      { id: "1-5", name: "Noir M", sku: "TS-BM", price: 19.99, cost: 8.5, stock: 25 },
      { id: "1-6", name: "Noir L", sku: "TS-BL", price: 19.99, cost: 8.5, stock: 10 },
    ],
  },
  {
    id: "2",
    name: "Casque audio",
    description: "Casque audio sans fil avec réduction de bruit",
    category: "Électronique",
    image: "/audio-system.png",
    variants: [
      { id: "2-1", name: "Noir", sku: "HP-B", price: 99.99, cost: 45.0, stock: 10 },
      { id: "2-2", name: "Blanc", sku: "HP-W", price: 99.99, cost: 45.0, stock: 8 },
    ],
  },
  {
    id: "3",
    name: "Bouteille isotherme",
    description: "Bouteille isotherme en acier inoxydable",
    category: "Accessoires",
    image: "/glass-bottle-still-life.png",
    variants: [
      { id: "3-1", name: "500ml Argent", sku: "BT-S5", price: 24.99, cost: 10.0, stock: 20 },
      { id: "3-2", name: "500ml Noir", sku: "BT-B5", price: 24.99, cost: 10.0, stock: 15 },
      { id: "3-3", name: "750ml Argent", sku: "BT-S7", price: 29.99, cost: 12.5, stock: 12 },
      { id: "3-4", name: "750ml Noir", sku: "BT-B7", price: 29.99, cost: 12.5, stock: 10 },
    ],
  },
  {
    id: "4",
    name: "Portefeuille en cuir",
    description: "Portefeuille en cuir véritable",
    category: "Accessoires",
    image: "/leather-wallet-contents.png",
    variants: [
      { id: "4-1", name: "Marron", sku: "WL-BR", price: 49.99, cost: 20.0, stock: 8 },
      { id: "4-2", name: "Noir", sku: "WL-BL", price: 49.99, cost: 20.0, stock: 12 },
    ],
  },
  {
    id: "5",
    name: "Montre connectée",
    description: "Montre connectée avec suivi d'activité",
    category: "Électronique",
    image: "/modern-smartwatch-display.png",
    variants: [
      { id: "5-1", name: "Noir", sku: "SW-B", price: 149.99, cost: 70.0, stock: 5 },
      { id: "5-2", name: "Argent", sku: "SW-S", price: 149.99, cost: 70.0, stock: 7 },
    ],
  },
]

// Données initiales pour les mouvements d'inventaire
const initialInventoryMovements: InventoryMovement[] = []

// Données initiales pour les transactions de caisse
const initialCashTransactions: CashTransaction[] = []

// Données initiales pour les fournisseurs
const initialSuppliers: Supplier[] = []

// Données initiales pour les factures d'achat
const initialPurchaseInvoices: PurchaseInvoice[] = []

// Données initiales pour les clients
const initialCustomers: Customer[] = []

// Données initiales pour les factures de vente
const initialSalesInvoices: SalesInvoice[] = []

// Données initiales pour les packs
const initialPacks: Pack[] = []

// Fournisseur du contexte
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(initialInventoryMovements)
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(initialCashTransactions)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(initialPurchaseInvoices)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(initialSalesInvoices)
  const [packs, setPacks] = useState<Pack[]>(initialPacks)

  const addCustomer = (customer: Customer) => {
    setCustomers((prevCustomers) => [...prevCustomers, customer])
  }

  const updateCustomer = (id: string, customer: Customer) => {
    setCustomers((prevCustomers) => prevCustomers.map((c) => (c.id === id ? customer : c)))
  }

  const deleteCustomer = (id: string) => {
    setCustomers((prevCustomers) => prevCustomers.filter((c) => c.id !== id))
  }

  const categoryDistribution = [
    { name: "Electronics", value: 45 },
    { name: "Clothing", value: 20 },
    { name: "Accessories", value: 15 },
    { name: "Home Goods", value: 12 },
    { name: "Fitness", value: 8 },
  ]

  const topSellingProducts = [
    { name: "Wireless Earbuds Pro", sales: 1245, revenue: 161850, growth: 15.2 },
    { name: "Premium Leather Wallet", sales: 986, revenue: 59160, growth: 8.7 },
    { name: "Smart Watch Series 5", sales: 879, revenue: 219750, growth: 12.3 },
    { name: "Organic Cotton T-Shirt", sales: 654, revenue: 19620, growth: -2.5 },
    { name: "Stainless Steel Water Bottle", sales: 542, revenue: 13550, growth: 5.8 },
  ]

  const inventoryValue = [
    { month: "Jan", value: 980000 },
    { month: "Feb", value: 1020000 },
    { month: "Mar", value: 1150000 },
    { month: "Apr", value: 1080000 },
    { month: "May", value: 1190000 },
    { month: "Jun", value: 1245890 },
  ]

  const dailySales = [
    { date: "25/06", sales: 1250, orders: 850 },
    { date: "26/06", sales: 980, orders: 1200 },
    { date: "27/06", sales: 1450, orders: 950 },
    { date: "28/06", sales: 1100, orders: 780 },
    { date: "29/06", sales: 890, orders: 1050 },
    { date: "30/06", sales: 1300, orders: 1150 },
    { date: "01/07", sales: 1500, orders: 1350 },
    { date: "02/07", sales: 1200, orders: 900 },
    { date: "03/07", sales: 1350, orders: 1100 },
    { date: "04/07", sales: 1000, orders: 1200 },
    { date: "05/07", sales: 1450, orders: 950 },
    { date: "06/07", sales: 1300, orders: 1050 },
    { date: "07/07", sales: 1550, orders: 1250 },
    { date: "08/07", sales: 1400, orders: 1150 },
  ]

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        inventoryMovements,
        setInventoryMovements,
        cashTransactions,
        setCashTransactions,
        suppliers,
        setSuppliers,
        purchaseInvoices,
        setPurchaseInvoices,
        customers,
        setCustomers,
        salesInvoices,
        setSalesInvoices,
        packs,
        setPacks,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        categoryDistribution,
        topSellingProducts,
        inventoryValue,
        dailySales,
        movements: initialInventoryMovements,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// Hook pour utiliser le contexte
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
