"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Barcode,
  Download,
  User,
  Wallet,
  Package,
  CheckCircle,
  TruckIcon as TruckDelivery,
  FileText,
  ShoppingBag,
  Percent,
  DollarSign,
} from "lucide-react"
import { useShop } from "@/context/shop-context"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Type pour le livreur
type Deliveryman = {
  id: number
  name: string
  role: string
  email: string
  phone: string
  status: string
  region: string
  parcelsDelivered?: number
  parcelsReturned?: number
  parcelsAssigned?: number
  ordersConfirmed?: number
  ordersReturned?: number
  ordersDispatched?: number
  articlesProcessed?: number
  paymentMethod: string
  paymentRate: {
    perDelivery?: number
    perReturn?: number
    perConfirmation?: number
    perDispatch?: number
    perArticle?: number
    confirmationOnly?: number
    fixedRate?: number
    hourlyRate?: number
    commission?: {
      type: "percentage" | "fixed"
      value: number
    }
  }
  calculatedPayment: number
  paymentStatus: string
  avatar: string
}

// Type pour l'historique des paiements
type PaymentHistory = {
  id: string
  date: string
  amount: number
  period: string
  method: string
  status: "Payé" | "En attente" | "Annulé"
}

// Type pour les commandes traitées
type ProcessedOrder = {
  id: string
  trackingId: string
  date: string
  client: string
  wilaya: string
  status: "Confirmé" | "Livré" | "Retourné"
  articles: {
    name: string
    quantity: number
    price: number
  }[]
  totalArticles: number
  totalPrice: number
}

type DeliverymanDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliveryman: Deliveryman | null
}

export function DeliverymanDetailsSheet({ open, onOpenChange, deliveryman }: DeliverymanDetailsSheetProps) {
  const { getOrdersByStatus } = useShop()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedParcels, setSelectedParcels] = useState<string[]>([])
  const [barcodeValue, setBarcodeValue] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [scannedParcels, setScannedParcels] = useState<string[]>([])

  // État pour la commission modifiable
  const [commission, setCommission] = useState<{
    type: "percentage" | "fixed"
    value: number
  } | null>(null)

  // Initialiser la commission à partir des données du livreur
  useEffect(() => {
    if (deliveryman && deliveryman.paymentRate.commission) {
      setCommission({
        type: deliveryman.paymentRate.commission.type,
        value: deliveryman.paymentRate.commission.value,
      })
    } else {
      setCommission(null)
    }
  }, [deliveryman])

  // Focus sur l'input de code-barres quand l'onglet "Scanner" est actif
  useEffect(() => {
    if (activeTab === "scanner" && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [activeTab])

  // Données codées en dur pour les colis
  const inDeliveryOrders = useMemo(() => {
    return [
      {
        id: "CMD-1001",
        trackingId: "TRK-001234",
        name: "Ahmed Benali",
        wilaya: "Alger",
        totalPrice: 4500,
        date: "12/05/2023",
        articles: 3,
      },
      {
        id: "CMD-1002",
        trackingId: "TRK-001235",
        name: "Fatima Zahra",
        wilaya: "Oran",
        totalPrice: 3200,
        date: "12/05/2023",
        articles: 2,
      },
      {
        id: "CMD-1003",
        trackingId: "TRK-001236",
        name: "Karim Hadj",
        wilaya: "Constantine",
        totalPrice: 5800,
        date: "13/05/2023",
        articles: 4,
      },
      {
        id: "CMD-1004",
        trackingId: "TRK-001237",
        name: "Amina Khelifi",
        wilaya: "Annaba",
        totalPrice: 2900,
        date: "13/05/2023",
        articles: 1,
      },
      {
        id: "CMD-1005",
        trackingId: "TRK-001238",
        name: "Youcef Mansouri",
        wilaya: "Alger",
        totalPrice: 7200,
        date: "14/05/2023",
        articles: 5,
      },
    ]
  }, [])

  const deliveredOrders = useMemo(() => {
    return [
      {
        id: "CMD-0991",
        trackingId: "TRK-001224",
        name: "Mohamed Cherif",
        wilaya: "Alger",
        totalPrice: 3800,
        date: "10/05/2023",
        articles: 2,
      },
      {
        id: "CMD-0992",
        trackingId: "TRK-001225",
        name: "Samira Bouzidi",
        wilaya: "Blida",
        totalPrice: 4200,
        date: "10/05/2023",
        articles: 3,
      },
      {
        id: "CMD-0993",
        trackingId: "TRK-001226",
        name: "Omar Taleb",
        wilaya: "Alger",
        totalPrice: 6500,
        date: "11/05/2023",
        articles: 4,
      },
      {
        id: "CMD-0994",
        trackingId: "TRK-001227",
        name: "Leila Hamidi",
        wilaya: "Tizi Ouzou",
        totalPrice: 3100,
        date: "11/05/2023",
        articles: 2,
      },
      {
        id: "CMD-0995",
        trackingId: "TRK-001228",
        name: "Rachid Boudiaf",
        wilaya: "Alger",
        totalPrice: 5400,
        date: "12/05/2023",
        articles: 3,
      },
    ]
  }, [])

  // Données pour les commandes traitées par les préparateurs et confirmatrices
  const processedOrders: ProcessedOrder[] = useMemo(() => {
    return [
      {
        id: "CMD-0981",
        trackingId: "TRK-001214",
        date: "08/05/2023",
        client: "Nadir Belkacem",
        wilaya: "Alger",
        status: "Livré",
        articles: [
          { name: "Smartphone Samsung A52", quantity: 1, price: 45000 },
          { name: "Coque de protection", quantity: 1, price: 1200 },
          { name: "Écouteurs sans fil", quantity: 1, price: 3500 },
        ],
        totalArticles: 3,
        totalPrice: 49700,
      },
      {
        id: "CMD-0982",
        trackingId: "TRK-001215",
        date: "08/05/2023",
        client: "Yasmine Kaci",
        wilaya: "Oran",
        status: "Livré",
        articles: [
          { name: "Laptop HP Pavilion", quantity: 1, price: 85000 },
          { name: "Souris sans fil", quantity: 1, price: 2200 },
        ],
        totalArticles: 2,
        totalPrice: 87200,
      },
      {
        id: "CMD-0983",
        trackingId: "TRK-001216",
        date: "09/05/2023",
        client: "Mehdi Bouaziz",
        wilaya: "Constantine",
        status: "Retourné",
        articles: [
          { name: "Tablette Samsung Tab A", quantity: 1, price: 35000 },
          { name: "Étui de protection", quantity: 1, price: 1800 },
        ],
        totalArticles: 2,
        totalPrice: 36800,
      },
      {
        id: "CMD-0984",
        trackingId: "TRK-001217",
        date: "09/05/2023",
        client: "Lina Benhamou",
        wilaya: "Alger",
        status: "Confirmé",
        articles: [
          { name: "Montre connectée", quantity: 1, price: 12000 },
          { name: "Bracelet supplémentaire", quantity: 2, price: 1500 },
        ],
        totalArticles: 3,
        totalPrice: 15000,
      },
      {
        id: "CMD-0985",
        trackingId: "TRK-001218",
        date: "10/05/2023",
        client: "Kamel Ferhat",
        wilaya: "Annaba",
        status: "Livré",
        articles: [
          { name: "Écran PC 24 pouces", quantity: 1, price: 28000 },
          { name: "Câble HDMI", quantity: 1, price: 800 },
          { name: "Clavier mécanique", quantity: 1, price: 5500 },
        ],
        totalArticles: 3,
        totalPrice: 34300,
      },
      {
        id: "CMD-0986",
        trackingId: "TRK-001219",
        date: "10/05/2023",
        client: "Amina Djeridi",
        wilaya: "Sétif",
        status: "Livré",
        articles: [
          { name: "Imprimante laser", quantity: 1, price: 18000 },
          { name: "Cartouche d'encre", quantity: 2, price: 3500 },
          { name: "Ramette papier A4", quantity: 1, price: 900 },
        ],
        totalArticles: 4,
        totalPrice: 25900,
      },
      {
        id: "CMD-0987",
        trackingId: "TRK-001220",
        date: "11/05/2023",
        client: "Sofiane Mesbah",
        wilaya: "Alger",
        status: "Confirmé",
        articles: [
          { name: "Casque audio Bluetooth", quantity: 1, price: 7500 },
          { name: "Batterie externe", quantity: 1, price: 3200 },
        ],
        totalArticles: 2,
        totalPrice: 10700,
      },
    ]
  }, [])

  // Statistiques des articles vendus
  const articleStats = useMemo(() => {
    const stats: { name: string; quantity: number; revenue: number }[] = []

    processedOrders.forEach((order) => {
      if (order.status !== "Retourné") {
        order.articles.forEach((article) => {
          const existingArticle = stats.find((a) => a.name === article.name)
          if (existingArticle) {
            existingArticle.quantity += article.quantity
            existingArticle.revenue += article.price * article.quantity
          } else {
            stats.push({
              name: article.name,
              quantity: article.quantity,
              revenue: article.price * article.quantity,
            })
          }
        })
      }
    })

    return stats.sort((a, b) => b.quantity - a.quantity)
  }, [processedOrders])

  // Modifier la fonction handleBarcodeSubmit pour utiliser les données codées en dur
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!barcodeValue.trim()) {
      toast({
        title: "Code-barres vide",
        description: "Veuillez scanner un code-barres valide.",
        variant: "destructive",
      })
      return
    }

    // Données codées en dur pour les colis
    const allParcels = [
      ...inDeliveryOrders.map((o) => ({ id: o.id, trackingId: o.trackingId })),
      ...deliveredOrders.map((o) => ({ id: o.id, trackingId: o.trackingId })),
    ]

    // Rechercher la commande par trackingId
    const order = allParcels.find((o) => o.trackingId === barcodeValue.trim())

    if (order) {
      if (!scannedParcels.includes(order.id)) {
        setScannedParcels((prev) => [...prev, order.id])
        toast({
          title: "Colis scanné",
          description: `Le colis ${order.trackingId} a été scanné avec succès.`,
        })
      } else {
        toast({
          title: "Colis déjà scanné",
          description: `Le colis ${order.trackingId} a déjà été scanné.`,
        })
      }
    } else {
      toast({
        title: "Code-barres non trouvé",
        description: "Aucun colis trouvé avec ce code-barres pour ce livreur.",
        variant: "destructive",
      })
    }

    setBarcodeValue("")
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  const handleSelectParcel = (parcelId: string, checked: boolean) => {
    setSelectedParcels((prev) => {
      if (checked) {
        return [...prev, parcelId]
      } else {
        return prev.filter((id) => id !== parcelId)
      }
    })
  }

  // Calculer le montant à payer en fonction du rôle et de la méthode de paiement
  const calculateBasePayment = () => {
    if (!deliveryman) return 0

    // Obtenir les commandes scannées
    const scannedDeliveredOrders = deliveredOrders.filter((order) => scannedParcels.includes(order.id))
    const scannedInDeliveryOrders = inDeliveryOrders.filter((order) => scannedParcels.includes(order.id))

    // Calculer le nombre d'articles dans les commandes scannées
    const totalArticles = scannedDeliveredOrders.reduce((sum, order) => sum + order.articles, 0)

    let basePayment = 0

    switch (deliveryman.role) {
      case "Livreur":
        // Paiement par livraison et retour
        const deliveredCount = scannedDeliveredOrders.length
        const returnedCount = scannedInDeliveryOrders.length
        basePayment =
          deliveredCount * (deliveryman.paymentRate.perDelivery || 0) +
          returnedCount * (deliveryman.paymentRate.perReturn || 0)
        break

      case "Préparateur":
        if (deliveryman.paymentMethod === "Par article") {
          // Paiement par article
          basePayment = totalArticles * (deliveryman.paymentRate.perArticle || 0)
        } else {
          // Paiement par commande
          basePayment = scannedDeliveredOrders.length * (deliveryman.paymentRate.perConfirmation || 0)
        }
        break

      case "Confirmatrice":
        if (deliveryman.paymentMethod === "Confirmation uniquement") {
          // Paiement par confirmation uniquement
          basePayment = scannedDeliveredOrders.length * (deliveryman.paymentRate.confirmationOnly || 0)
        } else {
          // Paiement par commande
          basePayment = scannedDeliveredOrders.length * (deliveryman.paymentRate.perConfirmation || 0)
        }
        break

      default:
        basePayment = 0
    }

    return basePayment
  }

  // Données pour les graphiques de performance
  const performanceData = [
    { name: "Jan", delivered: 42, returned: 3 },
    { name: "Fév", delivered: 38, returned: 4 },
    { name: "Mar", delivered: 45, returned: 2 },
    { name: "Avr", delivered: 50, returned: 5 },
    { name: "Mai", delivered: 53, returned: 3 },
    { name: "Juin", delivered: 48, returned: 4 },
  ]

  // Données pour le graphique en camembert selon le rôle
  const getPieChartData = () => {
    if (!deliveryman) return []

    switch (deliveryman.role) {
      case "Livreur":
        return [
          { name: "Livrés", value: deliveryman.parcelsDelivered || 0 },
          { name: "Retournés", value: deliveryman.parcelsReturned || 0 },
        ]
      case "Préparateur":
      case "Confirmatrice":
        return [
          { name: "Confirmés", value: deliveryman.ordersConfirmed || 0 },
          { name: "Retournés", value: deliveryman.ordersReturned || 0 },
        ]
      default:
        return []
    }
  }

  const COLORS = ["#22d3ee", "#f43f5e", "#a855f7"]

  // Historique des paiements (simulé)
  const paymentHistory: PaymentHistory[] = [
    {
      id: "PAY-2023-001",
      date: "15/04/2023",
      amount: 225.5,
      period: "Mars 2023",
      method: "Virement bancaire",
      status: "Payé",
    },
    {
      id: "PAY-2023-002",
      date: "15/03/2023",
      amount: 312.75,
      period: "Février 2023",
      method: "Virement bancaire",
      status: "Payé",
    },
    {
      id: "PAY-2023-003",
      date: "15/02/2023",
      amount: 287.5,
      period: "Janvier 2023",
      method: "Virement bancaire",
      status: "Payé",
    },
  ]

  // Obtenir la couleur du badge pour le statut de paiement
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Payé":
        return "bg-green-950/50 text-green-400 border-green-700"
      case "En attente":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      case "Annulé":
        return "bg-red-950/50 text-red-400 border-red-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }

  // Obtenir la couleur du badge pour le statut de commande
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "Livré":
        return "bg-green-950/50 text-green-400 border-green-700"
      case "Confirmé":
        return "bg-blue-950/50 text-blue-400 border-blue-700"
      case "Retourné":
        return "bg-red-950/50 text-red-400 border-red-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }

  // Obtenir l'icône et le texte pour le mode de paiement
  const getPaymentMethodInfo = () => {
    if (!deliveryman) return { icon: null, text: "" }

    switch (deliveryman.role) {
      case "Livreur":
        return {
          icon: <TruckDelivery className="h-5 w-5 text-cyan-400" />,
          text: `${deliveryman.paymentRate.perDelivery} DA par livraison / ${deliveryman.paymentRate.perReturn} DA par retour`,
        }
      case "Préparateur":
        if (deliveryman.paymentMethod === "Par article") {
          return {
            icon: <Package className="h-5 w-5 text-purple-400" />,
            text: `${deliveryman.paymentRate.perArticle} DA par article`,
          }
        } else {
          return {
            icon: <Package className="h-5 w-5 text-purple-400" />,
            text: `${deliveryman.paymentRate.perConfirmation} DA par commande`,
          }
        }
      case "Confirmatrice":
        if (deliveryman.paymentMethod === "Confirmation uniquement") {
          return {
            icon: <CheckCircle className="h-5 w-5 text-green-400" />,
            text: `${deliveryman.paymentRate.confirmationOnly} DA par confirmation`,
          }
        } else {
          return {
            icon: <CheckCircle className="h-5 w-5 text-green-400" />,
            text: `${deliveryman.paymentRate.perConfirmation} DA par commande`,
          }
        }
      default:
        return { icon: null, text: "" }
    }
  }

  if (!deliveryman) {
    return null
  }

  const paymentMethodInfo = getPaymentMethodInfo()

  // Calculer les statistiques des commandes
  const orderStats = {
    total: processedOrders.length,
    confirmed: processedOrders.filter((o) => o.status === "Confirmé").length,
    delivered: processedOrders.filter((o) => o.status === "Livré").length,
    returned: processedOrders.filter((o) => o.status === "Retourné").length,
    totalArticles: processedOrders.reduce((sum, order) => sum + order.totalArticles, 0),
    totalRevenue: processedOrders
      .filter((o) => o.status !== "Retourné")
      .reduce((sum, order) => sum + order.totalPrice, 0),
  }

  // Calculer la commission
  const calculateCommission = () => {
    if (!commission) return 0

    // Pour les préparateurs et confirmatrices, utiliser les données des commandes traitées
    if (deliveryman.role === "Préparateur" || deliveryman.role === "Confirmatrice") {
      const totalRevenue = processedOrders
        .filter((o) => o.status !== "Retourné")
        .reduce((sum, order) => sum + order.totalPrice, 0)

      if (commission.type === "percentage") {
        return totalRevenue * (commission.value / 100)
      } else {
        return commission.value
      }
    }

    // Pour les livreurs, utiliser les commandes scannées
    else if (deliveryman.role === "Livreur") {
      const scannedDeliveredOrders = deliveredOrders.filter((order) => scannedParcels.includes(order.id))
      const totalRevenue = scannedDeliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0)

      if (commission.type === "percentage") {
        return totalRevenue * (commission.value / 100)
      } else {
        return commission.value
      }
    }

    return 0
  }

  // Calculer le total du paiement (base + commission)
  const calculateTotalPayment = () => {
    const basePayment = calculateBasePayment()
    const commissionAmount = calculateCommission()
    return basePayment + commissionAmount
  }

  // Gérer le changement de type de commission
  const handleCommissionTypeChange = (value: string) => {
    if (value === "percentage" || value === "fixed") {
      setCommission((prev) => ({
        type: value,
        value: prev ? prev.value : 0,
      }))
    } else if (value === "none") {
      setCommission(null)
    }
  }

  // Gérer le changement de valeur de commission
  const handleCommissionValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(e.target.value)
    if (!isNaN(value) && commission) {
      setCommission({
        ...commission,
        value: value,
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <Toaster />
        <SheetHeader className="pb-4">
          <SheetTitle className="text-2xl">Détails du travailleur</SheetTitle>
          <SheetDescription>Informations détaillées, colis et facturation pour {deliveryman.name}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className={cn("grid mb-4", deliveryman.role === "Livreur" ? "grid-cols-3" : "grid-cols-3")}>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            {deliveryman.role === "Livreur" ? (
              <TabsTrigger value="scanner">Scanner</TabsTrigger>
            ) : (
              <TabsTrigger value="orders">Commandes</TabsTrigger>
            )}
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          {/* Onglet Aperçu */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{deliveryman.name}</h3>
                <p className="text-slate-400">
                  {deliveryman.role} - {deliveryman.region}
                </p>
              </div>
              <Badge className={getPaymentStatusColor(deliveryman.paymentStatus)}>{deliveryman.paymentStatus}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100">Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-100">{deliveryman.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Téléphone:</span>
                    <span className="text-slate-100">{deliveryman.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Région:</span>
                    <span className="text-slate-100">{deliveryman.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Statut:</span>
                    <Badge variant="outline">{deliveryman.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100">Mode de paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    {paymentMethodInfo.icon}
                    <Badge variant="outline" className="bg-blue-950/50 text-blue-400 border-blue-700">
                      {deliveryman.paymentMethod}
                    </Badge>
                  </div>
                  <div className="text-slate-100">{paymentMethodInfo.text}</div>

                  {/* Add commission information */}
                  {commission && (
                    <div className="flex justify-between pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Commission:</span>
                      <span className="text-slate-100">
                        {commission.type === "percentage"
                          ? `${commission.value}% du CA`
                          : `${commission.value} DA fixe`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Paiement calculé:</span>
                    <span className="text-xl font-bold text-slate-100">{deliveryman.calculatedPayment} DA</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-100">Performance</CardTitle>
                <CardDescription>Historique des livraisons sur 6 mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                        itemStyle={{ color: "#f8fafc" }}
                        labelStyle={{ color: "#94a3b8" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="delivered"
                        name="Livrés"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        dot={{ stroke: "#22d3ee", strokeWidth: 2, fill: "#0f172a", r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="returned"
                        name="Retournés"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={{ stroke: "#f43f5e", strokeWidth: 2, fill: "#0f172a", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100">Taux de performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="#0f172a"
                          strokeWidth={2}
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                          itemStyle={{ color: "#f8fafc" }}
                          labelStyle={{ color: "#94a3b8" }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-100">Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deliveryman.role === "Livreur" && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Colis assignés:</span>
                        <span className="text-slate-100">{deliveryman.parcelsAssigned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Colis livrés:</span>
                        <span className="text-slate-100">{deliveryman.parcelsDelivered}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Colis retournés:</span>
                        <span className="text-slate-100">{deliveryman.parcelsReturned}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Taux de livraison:</span>
                          <span className="text-slate-100">
                            {((deliveryman.parcelsDelivered! / deliveryman.parcelsAssigned!) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {(deliveryman.role === "Préparateur" || deliveryman.role === "Confirmatrice") && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Commandes confirmées:</span>
                        <span className="text-slate-100">{deliveryman.ordersConfirmed}</span>
                      </div>
                      {deliveryman.role === "Préparateur" && deliveryman.paymentMethod === "Par article" && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Articles traités:</span>
                          <span className="text-slate-100">{deliveryman.articlesProcessed}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Commandes retournées:</span>
                        <span className="text-slate-100">{deliveryman.ordersReturned}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Taux de retour:</span>
                          <span className="text-slate-100">
                            {((deliveryman.ordersReturned! / deliveryman.ordersConfirmed!) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Scanner (uniquement pour les livreurs) */}
          {deliveryman.role === "Livreur" && (
            <TabsContent value="scanner" className="space-y-4">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Scanner les colis</CardTitle>
                  <CardDescription>Scannez les codes-barres des colis pour calculer le paiement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                      <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Scanner un code-barres..."
                        className="w-full pl-8 bg-slate-800/50 border-slate-700 focus-visible:ring-cyan-500"
                        value={barcodeValue}
                        onChange={(e) => setBarcodeValue(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                    >
                      Scanner
                    </Button>
                  </form>

                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-lg font-medium mb-2">Colis à traiter</h4>
                    <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-slate-900 z-10">
                            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                              <TableHead className="w-[40px] text-slate-400">
                                <Checkbox checked={false} className="bg-slate-800/50 border-slate-700" />
                              </TableHead>
                              <TableHead className="text-slate-400">ID</TableHead>
                              <TableHead className="text-slate-400">Client</TableHead>
                              <TableHead className="text-slate-400">Wilaya</TableHead>
                              <TableHead className="text-slate-400">Montant</TableHead>
                              <TableHead className="text-slate-400">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inDeliveryOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className={cn(
                                  "border-slate-800 hover:bg-slate-800/50",
                                  selectedParcels.includes(order.id) && "bg-slate-800/30",
                                  scannedParcels.includes(order.id) && "bg-cyan-900/20",
                                )}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedParcels.includes(order.id)}
                                    onCheckedChange={(checked) => handleSelectParcel(order.id, checked === true)}
                                    className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-slate-300">
                                  {order.trackingId}
                                  {scannedParcels.includes(order.id) && (
                                    <Badge className="ml-2 bg-cyan-950/50 text-cyan-400 border-cyan-700">Scanné</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-slate-300">{order.name}</TableCell>
                                <TableCell className="text-slate-300">{order.wilaya}</TableCell>
                                <TableCell className="text-slate-300">{order.totalPrice} DA</TableCell>
                                <TableCell className="text-slate-300">{order.date}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-lg font-medium mb-2">Colis traités</h4>
                    <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-slate-900 z-10">
                            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                              <TableHead className="w-[40px] text-slate-400">
                                <Checkbox checked={false} className="bg-slate-800/50 border-slate-700" />
                              </TableHead>
                              <TableHead className="text-slate-400">ID</TableHead>
                              <TableHead className="text-slate-400">Client</TableHead>
                              <TableHead className="text-slate-400">Wilaya</TableHead>
                              <TableHead className="text-slate-400">Montant</TableHead>
                              <TableHead className="text-slate-400">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deliveredOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className={cn(
                                  "border-slate-800 hover:bg-slate-800/50",
                                  selectedParcels.includes(order.id) && "bg-slate-800/30",
                                  scannedParcels.includes(order.id) && "bg-cyan-900/20",
                                )}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedParcels.includes(order.id)}
                                    onCheckedChange={(checked) => handleSelectParcel(order.id, checked === true)}
                                    className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-slate-300">
                                  {order.trackingId}
                                  {scannedParcels.includes(order.id) && (
                                    <Badge className="ml-2 bg-cyan-950/50 text-cyan-400 border-cyan-700">Scanné</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-slate-300">{order.name}</TableCell>
                                <TableCell className="text-slate-300">{order.wilaya}</TableCell>
                                <TableCell className="text-slate-300">{order.totalPrice} DA</TableCell>
                                <TableCell className="text-slate-300">{order.date}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium">Calcul du paiement</h4>
                        <p className="text-sm text-slate-400">Basé sur les colis scannés</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Montant total</div>
                        <div className="text-2xl font-bold text-slate-100">{calculateTotalPayment().toFixed(2)} DA</div>
                      </div>
                    </div>

                    {/* Section de commission modifiable */}
                    <div className="mt-4 p-4 border border-slate-800 rounded-md bg-slate-900/30">
                      <h5 className="text-md font-medium mb-3">Commission</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="commission-type" className="text-sm text-slate-400">
                            Type de commission
                          </Label>
                          <Select
                            value={commission ? commission.type : "none"}
                            onValueChange={handleCommissionTypeChange}
                          >
                            <SelectTrigger id="commission-type" className="bg-slate-800/50 border-slate-700">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucune commission</SelectItem>
                              <SelectItem value="percentage">Pourcentage du CA</SelectItem>
                              <SelectItem value="fixed">Montant fixe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {commission && (
                          <div>
                            <Label htmlFor="commission-value" className="text-sm text-slate-400">
                              {commission.type === "percentage" ? "Pourcentage (%)" : "Montant (DA)"}
                            </Label>
                            <div className="relative">
                              <Input
                                id="commission-value"
                                type="number"
                                step={commission.type === "percentage" ? "0.1" : "100"}
                                value={commission.value}
                                onChange={handleCommissionValueChange}
                                className="bg-slate-800/50 border-slate-700 pl-8"
                              />
                              <div className="absolute left-2.5 top-2.5">
                                {commission.type === "percentage" ? (
                                  <Percent className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <DollarSign className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {commission && (
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Paiement de base:</span>
                            <span className="text-slate-100">{calculateBasePayment().toFixed(2)} DA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Commission ({commission.type === "percentage" ? `${commission.value}%` : "fixe"}):
                            </span>
                            <span className="text-slate-100">{calculateCommission().toFixed(2)} DA</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-700">
                            <span className="text-slate-400">Total:</span>
                            <span className="text-slate-100 font-bold">{calculateTotalPayment().toFixed(2)} DA</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button
                        variant="outline"
                        className="border-slate-700 bg-slate-800/50 text-slate-400"
                        onClick={() => setScannedParcels([])}
                      >
                        Réinitialiser
                      </Button>
                      <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
                        <Wallet className="mr-2 h-4 w-4" />
                        Confirmer paiement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Onglet Commandes (uniquement pour les préparateurs et confirmatrices) */}
          {(deliveryman.role === "Préparateur" || deliveryman.role === "Confirmatrice") && (
            <TabsContent value="orders" className="space-y-4">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Commandes traitées</CardTitle>
                  <CardDescription>
                    {deliveryman.role === "Préparateur"
                      ? "Liste des commandes préparées et articles traités"
                      : "Liste des commandes confirmées"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card className="border-slate-800 bg-slate-900/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">Total commandes</div>
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold mt-2">{orderStats.total}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-800 bg-slate-900/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">Articles traités</div>
                          <ShoppingBag className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold mt-2">{orderStats.totalArticles}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-800 bg-slate-900/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-400">Chiffre d'affaires</div>
                          <FileText className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="text-2xl font-bold mt-2">{orderStats.totalRevenue.toLocaleString()} DA</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-900 z-10">
                          <TableRow className="border-slate-800 hover:bg-slate-800/50">
                            <TableHead className="text-slate-400">ID</TableHead>
                            <TableHead className="text-slate-400">Date</TableHead>
                            <TableHead className="text-slate-400">Client</TableHead>
                            <TableHead className="text-slate-400">Articles</TableHead>
                            <TableHead className="text-slate-400">Montant</TableHead>
                            <TableHead className="text-slate-400">Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedOrders.map((order) => (
                            <TableRow key={order.id} className="border-slate-800 hover:bg-slate-800/50">
                              <TableCell className="font-medium text-slate-300">{order.trackingId}</TableCell>
                              <TableCell className="text-slate-300">{order.date}</TableCell>
                              <TableCell className="text-slate-300">{order.client}</TableCell>
                              <TableCell className="text-slate-300">{order.totalArticles}</TableCell>
                              <TableCell className="text-slate-300">{order.totalPrice.toLocaleString()} DA</TableCell>
                              <TableCell className="text-slate-300">
                                <Badge className={getOrderStatusColor(order.status)} variant="outline">
                                  {order.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-lg font-medium mb-4">Statistiques des articles</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={articleStats.slice(0, 5)} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            axisLine={false}
                            tickLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                            itemStyle={{ color: "#f8fafc" }}
                            labelStyle={{ color: "#94a3b8" }}
                            formatter={(value) => [`${value}`, "Quantité"]}
                          />
                          <Legend />
                          <Bar dataKey="quantity" name="Quantité vendue" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <h4 className="text-lg font-medium mb-2">Détail des articles vendus</h4>
                    <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-slate-900 z-10">
                            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                              <TableHead className="text-slate-400">Article</TableHead>
                              <TableHead className="text-slate-400 text-right">Quantité</TableHead>
                              <TableHead className="text-slate-400 text-right">Chiffre d'affaires</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {articleStats.map((article, index) => (
                              <TableRow key={index} className="border-slate-800 hover:bg-slate-800/50">
                                <TableCell className="font-medium text-slate-300">{article.name}</TableCell>
                                <TableCell className="text-slate-300 text-right">{article.quantity}</TableCell>
                                <TableCell className="text-slate-300 text-right">
                                  {article.revenue.toLocaleString()} DA
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium">Calcul du paiement</h4>
                        <p className="text-sm text-slate-400">
                          {deliveryman.role === "Préparateur" && deliveryman.paymentMethod === "Par article"
                            ? `Basé sur ${orderStats.totalArticles} articles traités`
                            : `Basé sur ${orderStats.total} commandes traitées`}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Montant total</div>
                        <div className="text-2xl font-bold text-slate-100">{calculateTotalPayment().toFixed(2)} DA</div>
                      </div>
                    </div>

                    {/* Section de commission modifiable */}
                    <div className="mt-4 p-4 border border-slate-800 rounded-md bg-slate-900/30">
                      <h5 className="text-md font-medium mb-3">Commission</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="commission-type" className="text-sm text-slate-400">
                            Type de commission
                          </Label>
                          <Select
                            value={commission ? commission.type : "none"}
                            onValueChange={handleCommissionTypeChange}
                          >
                            <SelectTrigger id="commission-type" className="bg-slate-800/50 border-slate-700">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucune commission</SelectItem>
                              <SelectItem value="percentage">Pourcentage du CA</SelectItem>
                              <SelectItem value="fixed">Montant fixe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {commission && (
                          <div>
                            <Label htmlFor="commission-value" className="text-sm text-slate-400">
                              {commission.type === "percentage" ? "Pourcentage (%)" : "Montant (DA)"}
                            </Label>
                            <div className="relative">
                              <Input
                                id="commission-value"
                                type="number"
                                step={commission.type === "percentage" ? "0.1" : "100"}
                                value={commission.value}
                                onChange={handleCommissionValueChange}
                                className="bg-slate-800/50 border-slate-700 pl-8"
                              />
                              <div className="absolute left-2.5 top-2.5">
                                {commission.type === "percentage" ? (
                                  <Percent className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <DollarSign className="h-4 w-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {commission && (
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Paiement de base:</span>
                            <span className="text-slate-100">{calculateBasePayment().toFixed(2)} DA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">
                              Commission ({commission.type === "percentage" ? `${commission.value}%` : "fixe"}):
                            </span>
                            <span className="text-slate-100">{calculateCommission().toFixed(2)} DA</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-700">
                            <span className="text-slate-400">Total:</span>
                            <span className="text-slate-100 font-bold">{calculateTotalPayment().toFixed(2)} DA</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-400">
                        Exporter les données
                      </Button>
                      <Button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500">
                        <Wallet className="mr-2 h-4 w-4" />
                        Confirmer paiement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Onglet Historique */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Historique des paiements</CardTitle>
                <CardDescription>Consultez l'historique des paiements effectués à {deliveryman.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-slate-800/50">
                        <TableHead className="text-slate-400">Référence</TableHead>
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400">Période</TableHead>
                        <TableHead className="text-slate-400">Montant</TableHead>
                        <TableHead className="text-slate-400">Méthode</TableHead>
                        <TableHead className="text-slate-400">Statut</TableHead>
                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-300">{payment.id}</TableCell>
                          <TableCell className="text-slate-300">{payment.date}</TableCell>
                          <TableCell className="text-slate-300">{payment.period}</TableCell>
                          <TableCell className="text-slate-300">{payment.amount.toFixed(2)} DA</TableCell>
                          <TableCell className="text-slate-300">{payment.method}</TableCell>
                          <TableCell className="text-slate-300">
                            <Badge className={getPaymentStatusColor(payment.status)} variant="outline">
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div>
                    <h4 className="text-lg font-medium">Total des paiements</h4>
                    <p className="text-sm text-slate-400">Tous les paiements effectués</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Montant total</div>
                    <div className="text-2xl font-bold text-slate-100">
                      {paymentHistory.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)} DA
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Évolution des paiements</CardTitle>
                <CardDescription>Visualisez l'évolution des paiements au fil du temps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={paymentHistory.map((p) => ({
                        name: p.period,
                        amount: p.amount,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                        itemStyle={{ color: "#f8fafc" }}
                        labelStyle={{ color: "#94a3b8" }}
                        formatter={(value) => [`${value} DA`, "Montant"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        name="Montant"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ stroke: "#a855f7", strokeWidth: 2, fill: "#0f172a", r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
