"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Pack } from "@/components/invoices/packs-management"
import { db } from "@/lib/firebase"
import { collection, collectionGroup, getDocs, limit, onSnapshot, query } from "firebase/firestore"

// Types for Shopify-like product structure
export type ProductOption = {
  id: string
  name: string
  position: number
  values: string[]
}

export type ProductImage = {
  id: string
  src: string
  position: number
  alt?: string | null
  variant_ids: string[]
}

export type ProductVariant = {
  id: string
  title: string
  price: string
  sku: string
  option1: string | null
  option2: string | null
  option3: string | null
  inventory_quantity: number
  inventory_management: string
  inventory_policy: string
  image_id?: string
}

export type Product = {
  id: string
  title: string
  body_html: string
  vendor: string
  product_type: string
  status: string
  tags: string
  variants: ProductVariant[]
  options: ProductOption[]
  images: ProductImage[]
  image?: ProductImage
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

// Type pour le contexte de l'application
type AppContextType = {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  inventoryMovements: InventoryMovement[]
  setInventoryMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>
  cashTransactions: CashTransaction[]
  setCashTransactions: React.Dispatch<React.SetStateAction<CashTransaction[]>>
  suppliers: Supplier[]
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>
  purchaseInvoices: PurchaseInvoice[]
  setPurchaseInvoices: React.Dispatch<React.SetStateAction<PurchaseInvoice[]>>
  customers: Customer[]
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>
  salesInvoices: SalesInvoice[]
  setSalesInvoices: React.Dispatch<React.SetStateAction<SalesInvoice[]>>
  packs: Pack[]
  setPacks: React.Dispatch<React.SetStateAction<Pack[]>>
}

// Création du contexte
const AppContext = createContext<AppContextType | undefined>(undefined)

// Données initiales pour les produits
const initialProducts: Product[] = [
  {
    id: "1",
    title: "T-shirt",
    body_html: "T-shirt en coton de haute qualité",
    vendor: "Fashion Brand",
    product_type: "Vêtements",
    status: "active",
    tags: "t-shirt, coton, vêtements",
    options: [
      {
        id: "1-1",
        name: "Couleur",
        position: 1,
        values: ["Blanc", "Noir"],
      },
      {
        id: "1-2",
        name: "Taille",
        position: 2,
        values: ["S", "M", "L"],
      },
    ],
    variants: [
      {
        id: "1-1",
        title: "Blanc / S",
        price: "19.99",
        sku: "TS-WS",
        option1: "Blanc",
        option2: "S",
        option3: null,
        inventory_quantity: 25,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "1-1-img",
      },
      {
        id: "1-2",
        title: "Blanc / M",
        price: "19.99",
        sku: "TS-WM",
        option1: "Blanc",
        option2: "M",
        option3: null,
        inventory_quantity: 30,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "1-1-img",
      },
      {
        id: "1-3",
        title: "Blanc / L",
        price: "19.99",
        sku: "TS-WL",
        option1: "Blanc",
        option2: "L",
        option3: null,
        inventory_quantity: 20,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "1-1-img",
      },
      {
        id: "1-4",
        title: "Noir / S",
        price: "19.99",
        sku: "TS-BS",
        option1: "Noir",
        option2: "S",
        option3: null,
        inventory_quantity: 15,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "1-2-img",
      },
      {
        id: "1-5",
        title: "Noir / M",
        price: "19.99",
        sku: "TS-BM",
        option1: "Noir",
        option2: "M",
        option3: null,
        inventory_quantity: 25,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "1-2-img",
      },
      {
        id: "1-6",
        title: "Noir / L",
        price: "19.99",
        sku: "TS-BL",
        option1: "Noir",
        option2: "L",
        option3: null,
        inventory_quantity: 10,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "1-2-img",
      },
    ],
    images: [
      {
        id: "1-1-img",
        src: "/classic-plain-tee.png",
        position: 1,
        alt: "T-shirt blanc",
        variant_ids: ["1-1", "1-2", "1-3"],
      },
      {
        id: "1-2-img",
        src: "/classic-plain-tee.png",
        position: 2,
        alt: "T-shirt noir",
        variant_ids: ["1-4", "1-5", "1-6"],
      },
    ],
    image: {
      id: "1-1-img",
      src: "/classic-plain-tee.png",
      position: 1,
      alt: "T-shirt blanc",
      variant_ids: ["1-1", "1-2", "1-3"],
    },
  },
  {
    id: "2",
    title: "Casque audio",
    body_html: "Casque audio sans fil avec réduction de bruit",
    vendor: "Tech Brand",
    product_type: "Électronique",
    status: "active",
    tags: "casque, audio, électronique",
    options: [
      {
        id: "2-1",
        name: "Couleur",
        position: 1,
        values: ["Noir", "Blanc"],
      },
    ],
    variants: [
      {
        id: "2-1",
        title: "Noir",
        price: "99.99",
        sku: "HP-B",
        option1: "Noir",
        option2: null,
        option3: null,
        inventory_quantity: 10,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "2-1-img",
      },
      {
        id: "2-2",
        title: "Blanc",
        price: "99.99",
        sku: "HP-W",
        option1: "Blanc",
        option2: null,
        option3: null,
        inventory_quantity: 8,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "2-2-img",
      },
    ],
    images: [
      {
        id: "2-1-img",
        src: "/audio-system.png",
        position: 1,
        alt: "Casque audio noir",
        variant_ids: ["2-1"],
      },
      {
        id: "2-2-img",
        src: "/audio-system.png",
        position: 2,
        alt: "Casque audio blanc",
        variant_ids: ["2-2"],
      },
    ],
    image: {
      id: "2-1-img",
      src: "/audio-system.png",
      position: 1,
      alt: "Casque audio noir",
      variant_ids: ["2-1"],
    },
  },
  {
    id: "3",
    title: "Bouteille isotherme",
    body_html: "Bouteille isotherme en acier inoxydable",
    vendor: "Eco Brand",
    product_type: "Accessoires",
    status: "active",
    tags: "bouteille, isotherme, accessoires",
    options: [
      {
        id: "3-1",
        name: "Couleur",
        position: 1,
        values: ["Argent", "Noir"],
      },
      {
        id: "3-2",
        name: "Taille",
        position: 2,
        values: ["500ml", "750ml"],
      },
    ],
    variants: [
      {
        id: "3-1",
        title: "Argent / 500ml",
        price: "24.99",
        sku: "BT-S5",
        option1: "Argent",
        option2: "500ml",
        option3: null,
        inventory_quantity: 20,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "3-1-img",
      },
      {
        id: "3-2",
        title: "Noir / 500ml",
        price: "24.99",
        sku: "BT-B5",
        option1: "Noir",
        option2: "500ml",
        option3: null,
        inventory_quantity: 15,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "3-2-img",
      },
      {
        id: "3-3",
        title: "Argent / 750ml",
        price: "29.99",
        sku: "BT-S7",
        option1: "Argent",
        option2: "750ml",
        option3: null,
        inventory_quantity: 12,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "3-1-img",
      },
      {
        id: "3-4",
        title: "Noir / 750ml",
        price: "29.99",
        sku: "BT-B7",
        option1: "Noir",
        option2: "750ml",
        option3: null,
        inventory_quantity: 10,
        inventory_management: "shopify",
        inventory_policy: "deny",
        image_id: "3-2-img",
      },
    ],
    images: [
      {
        id: "3-1-img",
        src: "/glass-bottle-still-life.png",
        position: 1,
        alt: "Bouteille isotherme argent",
        variant_ids: ["3-1", "3-3"],
      },
      {
        id: "3-2-img",
        src: "/glass-bottle-still-life.png",
        position: 2,
        alt: "Bouteille isotherme noire",
        variant_ids: ["3-2", "3-4"],
      },
    ],
    image: {
      id: "3-1-img",
      src: "/glass-bottle-still-life.png",
      position: 1,
      alt: "Bouteille isotherme argent",
      variant_ids: ["3-1", "3-3"],
    },
  },
]

// Données initiales pour les mouvements d'inventaire
const initialInventoryMovements: InventoryMovement[] = [
  {
    id: "1",
    date: "2023-05-01",
    productId: "1",
    variantId: "1-1",
    quantity: 10,
    type: "in",
    reason: "Réception de stock initial",
  },
  {
    id: "2",
    date: "2023-05-02",
    productId: "1",
    variantId: "1-2",
    quantity: 15,
    type: "in",
    reason: "Réception de stock initial",
  },
  {
    id: "3",
    date: "2023-05-03",
    productId: "2",
    variantId: "2-1",
    quantity: 5,
    type: "in",
    reason: "Réception de stock initial",
  },
  {
    id: "4",
    date: "2023-05-05",
    productId: "1",
    variantId: "1-1",
    quantity: 2,
    type: "out",
    reason: "Vente",
  },
  {
    id: "5",
    date: "2023-05-06",
    productId: "2",
    variantId: "2-1",
    quantity: 1,
    type: "out",
    reason: "Vente",
  },
]

// Données initiales pour les transactions de caisse
const initialCashTransactions: CashTransaction[] = [
  {
    id: "1",
    date: "2023-05-01",
    amount: 1000,
    type: "in",
    category: "Investissement",
    description: "Investissement initial",
  },
  {
    id: "2",
    date: "2023-05-02",
    amount: 500,
    type: "out",
    category: "Achat de stock",
    description: "Paiement fournisseur pour stock initial",
  },
  {
    id: "3",
    date: "2023-05-05",
    amount: 39.98,
    type: "in",
    category: "Vente",
    description: "Vente de 2 T-shirts",
  },
  {
    id: "4",
    date: "2023-05-06",
    amount: 99.99,
    type: "in",
    category: "Vente",
    description: "Vente d'un casque audio",
  },
]

// Données initiales pour les fournisseurs
const initialSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Textile Pro",
    contact: "Jean Dupont",
    email: "contact@textilepro.com",
    phone: "01 23 45 67 89",
    address: "123 Rue du Textile, 75001 Paris",
  },
  {
    id: "2",
    name: "ElectroTech",
    contact: "Marie Martin",
    email: "info@electrotech.com",
    phone: "01 98 76 54 32",
    address: "456 Avenue de l'Électronique, 69002 Lyon",
  },
  {
    id: "3",
    name: "AccessoireShop",
    contact: "Pierre Durand",
    email: "contact@accessoireshop.com",
    phone: "01 45 67 89 10",
    address: "789 Boulevard des Accessoires, 33000 Bordeaux",
  },
]

// Données initiales pour les factures d'achat
const initialPurchaseInvoices: PurchaseInvoice[] = [
  {
    id: "1",
    date: "2023-04-28",
    supplierId: "1",
    reference: "FA-2023-001",
    items: [
      { id: "1", productId: "1", variantId: "1-1", quantity: 25, unitPrice: 8.5 },
      { id: "2", productId: "1", variantId: "1-2", quantity: 30, unitPrice: 8.5 },
      { id: "3", productId: "1", variantId: "1-3", quantity: 20, unitPrice: 8.5 },
    ],
    status: "paid",
    totalAmount: 637.5,
  },
  {
    id: "2",
    date: "2023-04-29",
    supplierId: "2",
    reference: "FA-2023-002",
    items: [
      { id: "1", productId: "2", variantId: "2-1", quantity: 10, unitPrice: 45.0 },
      { id: "2", productId: "2", variantId: "2-2", quantity: 8, unitPrice: 45.0 },
    ],
    status: "paid",
    totalAmount: 810.0,
  },
]

// Données initiales pour les clients
const initialCustomers: Customer[] = [
  {
    id: "1",
    name: "Boutique Mode",
    contact: "Sophie Lefebvre",
    email: "contact@boutiquemode.com",
    phone: "01 23 45 67 89",
    address: "123 Rue de la Mode, 75008 Paris",
  },
  {
    id: "2",
    name: "TechStore",
    contact: "Thomas Bernard",
    email: "info@techstore.com",
    phone: "01 98 76 54 32",
    address: "456 Avenue de la Technologie, 69003 Lyon",
  },
]

// Données initiales pour les factures de vente
const initialSalesInvoices: SalesInvoice[] = [
  {
    id: "1",
    date: "2023-05-05",
    customerId: "1",
    reference: "FV-2023-001",
    items: [{ id: "1", productId: "1", variantId: "1-1", quantity: 2, unitPrice: 19.99 }],
    status: "paid",
    totalAmount: 39.98,
  },
  {
    id: "2",
    date: "2023-05-06",
    customerId: "2",
    reference: "FV-2023-002",
    items: [{ id: "1", productId: "2", variantId: "2-1", quantity: 1, unitPrice: 99.99 }],
    status: "paid",
    totalAmount: 99.99,
  },
]


// Fournisseur du contexte
export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(initialInventoryMovements)
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(initialCashTransactions)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(initialPurchaseInvoices)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(initialSalesInvoices)
  const [packs, setPacks] = useState<Pack[]>([])
  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product])
  }
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all products from the 'Products' collection
        const productRef = query(collection(db, 'Products'),limit(10));
        const snapshot = await getDocs(productRef);
    
        // Array to hold the final inventory data
        const generatedInventory = [];
    
        // Loop through each product and fetch its variants
        for (const productDoc of snapshot.docs) {
          const productData = productDoc.data();
          const productId = productDoc.id;  // Get the product ID to query the variants subcollection
    
          // Fetch the variants subcollection for each product
          const variantsRef = collection(db, 'Products', productId, 'variants');
          const variantsSnapshot = await getDocs(variantsRef);
    
          // Get all variants for this product
          const variants = variantsSnapshot.docs.map(variantDoc => {
            return variantDoc.data();  // Just return the variant data
          });
    
          // Combine the product data and its variants
          const productWithVariants = {
            ...productData,  // Spread the product data
            id: productId,   // Add the product ID
            variants, 
            depots: [],       // Add the variants array
          };
    
          // Push the combined product data and variants to the inventory
          generatedInventory.push(productWithVariants);
        }

    
        // Set the final generated inventory (all products with their variants)
        setProducts(generatedInventory); // Assuming you have a setProducts function
      } catch (error) {
        console.error('Error fetching products and variants:', error);
      }
    };

    loadData();
  }, []);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collectionGroup(db, "variants"), (snapshot) => {
      setProducts((prevProducts) => {
        let updatedProducts = [...prevProducts] || [];


        snapshot.docChanges().forEach((change) => {
          const variantData = change.doc.data();
          const variantId = change.doc.id;
          const productId = change.doc.ref.parent.parent?.id;

          if (!productId) return;

          // Find the product in the array
          const productIndex = updatedProducts.findIndex(p => p.id === productId);
          if (productIndex === -1) return;

          const product = updatedProducts[productIndex];

          const variant = { id: variantId, ...variantData };
          const existingVariantIndex = product.variants.findIndex(v => String(v.id) === variantId);

          switch (change.type) {
            case "added":
              if (existingVariantIndex === -1) {
                product.variants.push(variant);
              }
              break;

            case "modified":
              if (existingVariantIndex !== -1) {
 
                
                product.variants[existingVariantIndex] = variant;
              }
              break;

            case "removed":
              if (existingVariantIndex !== -1) {
                product.variants.splice(existingVariantIndex, 1);
              }
              break;
          }

          // Replace the updated product in the array
          updatedProducts[productIndex] = { ...product };
        });

        return updatedProducts;
      });
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "packs"))
        const fetchedPacks: Pack[] = []
        querySnapshot.forEach((doc) => {
          fetchedPacks.push(doc.data() as Pack)
        })
        setPacks(fetchedPacks)
      } catch (error) {
        console.error("Erreur lors du chargement des packs:", error)
       
      }
    }
  
    fetchPacks()
  }, [])
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
        addProduct
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
