"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  CheckCircle,
  MoreHorizontal,
  Package,
  Search,
  ArrowRight,
  MessageSquare,
  Clock,
  Filter,
  PackageX,
  Columns,
  StickyNote,
  ChevronDown,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useShop, type DeliveryType, type SmsStatus, type Order } from "@/context/shop-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO, toDate } from "date-fns"
import { collection, doc, setDoc, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useOrderSearchParams } from "@/hooks/use-search-params"
import { useAuth } from "@/context/auth-context"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"
// Types pour les nœuds de suivi
type TrackingNode =
  | "En transit"
  | "Arrivé au hub"
  | "En cours de livraison"
  | "Tentative échouée"
  | "Reporté"
  | "Prêt à livrer"

// Liste des nœuds de suivi disponibles
const trackingNodes: TrackingNode[] = [
  "ferme",
  "nrp",
  "j attendes",
  "faux numero",
  "faux commande",
  "ok",
  "reporte",
  "pas seriux",
  "occupe",
  "en voyage",
  "sms envoye",
  "achete ailleurs",
  "annule",
];

// Type pour les notes
type OrderNote = {
  id: string
  orderId: string
  text: string
  date: string
  author: string
  trackingNode?: TrackingNode
}

// Type pour l'historique de suivi
type TrackingHistory = {
  id: string
  orderId: string
  trackingNode: TrackingNode
  date: string
  author: string
  note?: string
  timestamp?: any
}

// Type étendu pour les commandes avec tracking
type OrderWithTracking = Order & {
  currentTrackingNode?: TrackingNode
  trackingHistory?: TrackingHistory[]
}

export function EnLivraisonTable() {
  const { getOrdersByStatus, updateMultipleOrdersStatus, sendSmsReminder, updateOrder, loading } = useShop()
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
const searchFilters = useOrderSearchParams()
const [searchTerm, setSearchTerm] = useState(
  searchFilters.searchId ||
    searchFilters.searchName ||
    searchFilters.searchPhone ||
    searchFilters.searchTrackingId ||
    "",
)

useEffect(() => {
  const urlSearchTerm =
    searchFilters.searchId ||
    searchFilters.searchName ||
    searchFilters.searchPhone ||
    searchFilters.searchTrackingId ||
    ""
  if (urlSearchTerm) {
    setSearchTerm(urlSearchTerm)
  }
}, [searchFilters])
  // États pour les filtres
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all")
  const [deliveryCompanyFilter, setDeliveryCompanyFilter] = useState<string>("all")
  const [trackingNodeFilter, setTrackingNodeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  // États pour la modal de notes
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string>("")
  const [noteText, setNoteText] = useState<string>("")

  // États pour la modal de détails
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithTracking | null>(null)

  // États pour les données Firebase
  const [notes, setNotes] = useState<OrderNote[]>([])
  const [orderTrackingNodes, setOrderTrackingNodes] = useState<Record<string, TrackingNode>>({})
  const [trackingHistory, setTrackingHistory] = useState<TrackingHistory[]>([])

  // États pour la modal de notes de suivi
  const [isTrackingNoteModalOpen, setIsTrackingNoteModalOpen] = useState(false)
  const [currentTrackingNode, setCurrentTrackingNode] = useState<TrackingNode | null>(null)
  const [trackingNoteText, setTrackingNoteText] = useState<string>("")

  // État pour la visibilité des colonnes
  const [visibleColumns, setVisibleColumns] = useState({
    trackingId: true,
    recipient: true,
    status: true,
    trackingNode: true,
    sms: true,
    type: true,
    wilaya: true,
    commune: true,
    deliveryCompany: true,
    confirmatrice: true,
    preparateur: true,
    lastUpdated: true,
    sendReminder: true,
    articles: true,
  })

  // Écouter les changements Firebase pour les nœuds de suivi
  useEffect(() => {
    const unsubscribeTracking = onSnapshot(
      collection(db, "orderTracking"),
      (snapshot) => {
        const trackingData: Record<string, TrackingNode> = {}
        snapshot.forEach((doc) => {
          const data = doc.data()
          trackingData[data.orderId] = data.currentNode
        })
        setOrderTrackingNodes(trackingData)
      },
      (error) => {
        console.error("Error listening to tracking nodes:", error)
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser les nœuds de suivi.",
          variant: "destructive",
        })
      },
    )

    return () => unsubscribeTracking()
  }, [])

  // Écouter les changements Firebase pour l'historique de suivi
  useEffect(() => {
    const unsubscribeHistory = onSnapshot(
      query(collection(db, "trackingHistory"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const historyData: TrackingHistory[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          historyData.push({
            id: doc.id,
            orderId: data.orderId,
            trackingNode: data.trackingNode,
            date: data.date,
            author: data.author,
            note: data.note,
            timestamp: data.timestamp,
          })
        })
        setTrackingHistory(historyData)
      },
      (error) => {
        console.error("Error listening to tracking history:", error)
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser l'historique de suivi.",
          variant: "destructive",
        })
      },
    )

    return () => unsubscribeHistory()
  }, [])

  // Écouter les changements Firebase pour les notes
  useEffect(() => {
    const unsubscribeNotes = onSnapshot(
      collection(db, "orderNotes"),
      (snapshot) => {
        const notesData: OrderNote[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          notesData.push({
            id: doc.id,
            orderId: data.orderId,
            text: data.text,
            date: data.date,
            author: data.author,
            trackingNode: data.trackingNode,
          })
        })
        setNotes(notesData)
      },
      (error) => {
        console.error("Error listening to notes:", error)
        toast({
          title: "Erreur de synchronisation",
          description: "Impossible de synchroniser les notes.",
          variant: "destructive",
        })
      },
    )

    return () => unsubscribeNotes()
  }, [])

  // Fonction pour sauvegarder le nœud de suivi dans Firebase
  const saveTrackingNodeToFirebase = async (orderId: string, node: TrackingNode) => {
    try {
      const trackingRef = doc(db, "orderTracking", orderId)
      await setDoc(
        trackingRef,
        {
          orderId,
          currentNode: node,
          lastUpdated: serverTimestamp(),
          updatedBy: "current-user", // Remplacer par l'utilisateur actuel
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error saving tracking node:", error)
      throw error
    }
  }

  // Fonction pour sauvegarder l'historique de suivi dans Firebase
  const saveTrackingHistoryToFirebase = async (orderId: string, node: TrackingNode, note?: string) => {
    try {
      const historyRef = collection(db, "trackingHistory")
      await addDoc(historyRef, {
        orderId,
        trackingNode: node,
        date: new Date().toLocaleString("fr-FR"),
        author: "current-user", // Remplacer par l'utilisateur actuel
        note: note || null,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error saving tracking history:", error)
      throw error
    }
  }

  // Fonction pour sauvegarder une note dans Firebase
  const saveNoteToFirebase = async (orderId: string, text: string, trackingNode?: TrackingNode) => {
    try {
      const noteRef = collection(db, "orderNotes")
      await addDoc(noteRef, {
        orderId,
        text,
        date: new Date().toLocaleString("fr-FR"),
        author: "current-user", // Remplacer par l'utilisateur actuel
        trackingNode: trackingNode || null,
        timestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error saving note:", error)
      throw error
    }
  }

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }))
  }
  const { workerName } = useAuth()
const ordersWithTracking = useMemo(() => {
  const baseOrders = getOrdersByStatus("En livraison");

  // Filter based on workerName
  const filteredOrders = workerName
    ? baseOrders.filter(order => order.confirmatrice === workerName)
    : baseOrders;

  return filteredOrders.map((order) => ({
    ...order,
    currentTrackingNode: orderTrackingNodes[order.id],
    trackingHistory: trackingHistory.filter((h) => h.orderId === order.id),
  }));
}, [getOrdersByStatus, orderTrackingNodes, trackingHistory, workerName]);
  const [confirmatriceFilter, setConfirmatriceFilter] = useState<string>("all")

  // Obtenir les listes uniques pour les filtres - mémorisées
  const wilayas = useMemo(
    () => Array.from(new Set(ordersWithTracking.map((order) => order.wilaya))),
    [ordersWithTracking],
  )
  const deliveryTypes = useMemo(
    () => Array.from(new Set(ordersWithTracking.map((order) => order.deliveryType))),
    [ordersWithTracking],
  )
  const deliveryCompanies = useMemo(
    () => Array.from(new Set(ordersWithTracking.map((order) => order.deliveryCompany || "N/A"))),
    [ordersWithTracking],
  )
  const statuses = useMemo(
    () => Array.from(new Set(ordersWithTracking.map((order) => order.lastStatus))),
    [ordersWithTracking],
  )
    const confirmatrices =  useMemo(
    () => Array.from(new Set(ordersWithTracking.map((order) => order?.confirmatrice || " "))),
    [ordersWithTracking],
  )

  // Filtrer les commandes - mémorisé
  const filteredOrders = useMemo(() => {
    return ordersWithTracking.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesWilaya = wilayaFilter === "all" || order.wilaya === wilayaFilter
      const matchesDeliveryType = deliveryTypeFilter === "all" || order.deliveryType === deliveryTypeFilter
      const matchesDeliveryCompany = deliveryCompanyFilter === "all" || order.deliveryCompany === deliveryCompanyFilter
      const matchesTrackingNode = trackingNodeFilter === "all" || order.currentTrackingNode === trackingNodeFilter
const matchesstatus = statusFilter === "all" || order.lastStatus === statusFilter
      const matchesConfirmatrice =
        confirmatriceFilter === "all" ||
        (confirmatriceFilter === "non attribué" && order.confirmatrice === "") ||
        order.confirmatrice === confirmatriceFilter


// Date range filter
      let matchesDateRange = true
      if (dateRange) {
        try {
          const orderDate = parseISO(order.date)
          matchesDateRange = isWithinInterval(orderDate, {
            start: dateRange.from,
            end: dateRange.to,
          })
        } catch (error) {
          console.error("Error parsing date:", error)
        }
      }

      return (
        matchesSearch &&
        matchesWilaya &&
        matchesDeliveryType &&
        matchesDeliveryCompany &&
        matchesTrackingNode &&
       matchesstatus &&
        matchesConfirmatrice
      )
    })
  }, [
    ordersWithTracking,
    searchTerm,
    wilayaFilter,
    deliveryTypeFilter,
    deliveryCompanyFilter,
    trackingNodeFilter,
    dateRange,
  ])

  // Gérer la sélection de toutes les lignes - mémorisé
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedRows(filteredOrders.map((order) => order.id))
      } else {
        setSelectedRows([])
      }
    },
    [filteredOrders],
  )

  // Gérer la sélection d'une ligne - mémorisé
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id])
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    }
  }, [])

  // Déplacer les commandes sélectionnées vers "Livrés" - mémorisé
  const moveToLivres = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "Livrés")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "Livrés".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])

  // Déplacer les commandes sélectionnées vers "Retour" - mémorisé
  const moveToRetour = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "Retour")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "Retour".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])

  // Déplacer les commandes sélectionnées vers "Dispatcher" - mémorisé
  const moveBackToDispatcher = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "Dispatcher")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "Dispatcher".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])

  // Envoyer un SMS de rappel - mémorisé
  const handleSendReminder = useCallback(
    (id: string) => {
      sendSmsReminder(id)
      toast({
        title: "SMS envoyé",
        description: "Un SMS de rappel a été envoyé au client.",
      })
    },
    [sendSmsReminder],
  )

  // Ouvrir la modal de notes - mémorisé
  const openNoteModal = useCallback(
    (orderId: string) => {
      setCurrentOrderId(orderId)
      const existingNote = notes.find((note) => note.orderId === orderId)
      setNoteText(existingNote?.text || "")
      setIsNoteModalOpen(true)
    },
    [notes],
  )

  // Ouvrir la modal de détails - mémorisé
  const openDetailsModal = useCallback((order: OrderWithTracking) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }, [])

  // Sauvegarder une note - mémorisé
  const saveNote = useCallback(async () => {
    if (!noteText.trim()) {
      toast({
        title: "Note vide",
        description: "Veuillez entrer une note avant de sauvegarder.",
        variant: "destructive",
      })
      return
    }

    try {
      await saveNoteToFirebase(currentOrderId, noteText)

      toast({
        title: "Note sauvegardée",
        description: "La note a été sauvegardée avec succès.",
      })

      setIsNoteModalOpen(false)
      setNoteText("")
      setCurrentOrderId("")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la note.",
        variant: "destructive",
      })
    }
  }, [currentOrderId, noteText])

  // Mettre à jour le nœud de suivi d'une commande - mémorisé
  const updateTrackingNode = useCallback(async (orderId: string, node: TrackingNode, note?: string) => {
    try {
      // Sauvegarder le nœud de suivi
      await saveTrackingNodeToFirebase(orderId, node)

      // Sauvegarder l'historique
      await saveTrackingHistoryToFirebase(orderId, node, note)

      toast({
        title: "Nœud de suivi mis à jour",
        description: `Le nœud de suivi de la commande ${orderId} a été mis à jour.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le nœud de suivi.",
        variant: "destructive",
      })
    }
  }, [])

  // Ouvrir la modal de notes de suivi
  const openTrackingNoteModal = useCallback((orderId: string, node: TrackingNode) => {
    setCurrentOrderId(orderId)
    setCurrentTrackingNode(node)
    setTrackingNoteText("")
    setIsTrackingNoteModalOpen(true)
  }, [])

  // Sauvegarder une note de suivi
  const saveTrackingNote = useCallback(async () => {
    if (!currentTrackingNode) return

    try {
      await updateTrackingNode(currentOrderId, currentTrackingNode, trackingNoteText.trim() || undefined)

      setIsTrackingNoteModalOpen(false)
      setTrackingNoteText("")
      setCurrentOrderId("")
      setCurrentTrackingNode(null)
    } catch (error) {
      // L'erreur est déjà gérée dans updateTrackingNode
    }
  }, [currentOrderId, currentTrackingNode, trackingNoteText, updateTrackingNode])

  // Obtenir l'historique de suivi pour une commande
  const getTrackingHistoryForOrder = useCallback(
    (orderId: string) => {
      return trackingHistory.filter((history) => history.orderId === orderId)
    },
    [trackingHistory],
  )

  // Obtenir l'historique de suivi pour une confirmatrice
  const getTrackingHistoryForConfirmatrice = useCallback(
    (confirmatrice: string) => {
      return trackingHistory.filter((history) => {
        const order = ordersWithTracking.find((o) => o.id === history.orderId)
        return order?.confirmatrice === confirmatrice
      })
    },
    [trackingHistory, ordersWithTracking],
  )

  // Mettre à jour la société de livraison d'une commande - mémorisé
  const updateDeliveryCompany = useCallback(
    (orderId: string, company: string) => {
      updateOrder(orderId, { deliveryCompany: company })

      toast({
        title: "Société de livraison mise à jour",
        description: `La société de livraison de la commande ${orderId} a été mise à jour.`,
      })
    },
    [updateOrder],
  )

  // Réinitialiser les filtres - mémorisé
  const resetFilters = useCallback(() => {
    setWilayaFilter("all")
    setDeliveryTypeFilter("all")
    setDeliveryCompanyFilter("all")
    setTrackingNodeFilter("all")
    setDateRange(undefined)
  }, [])

  // Formater le numéro de téléphone pour WhatsApp
  const formatPhoneForWhatsApp = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")

    if (cleanPhone.startsWith("0")) {
      return "213" + cleanPhone.substring(1)
    }

    if (!cleanPhone.startsWith("213")) {
      return "213" + cleanPhone
    }

    return cleanPhone
  }, [])

  // Obtenir la couleur du badge pour le statut SMS - mémorisé
  const getSmsStatusColor = useCallback((status: SmsStatus) => {
    switch (status) {
      case "Envoyé":
        return "bg-green-950/50 text-green-400 border-green-700"
      case "Non envoyé":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      case "Échec":
        return "bg-red-950/50 text-red-400 border-red-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }, [])

  // Obtenir la couleur du badge pour le type de livraison - mémorisé
  const getDeliveryTypeColor = useCallback((type: DeliveryType) => {
    switch (type) {
      case "Domicile":
        return "bg-blue-950/50 text-blue-400 border-blue-700"
      case "Point de relais":
        return "bg-purple-950/50 text-purple-400 border-purple-700"
      case "Express":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }, [])

const getTrackingNodeColor = useCallback((node: TrackingNode | undefined) => {
  switch (node) {
    case "ferme":
      return "bg-gray-950/50 text-gray-400 border-gray-700";
    case "nrp":
      return "bg-yellow-950/50 text-yellow-400 border-yellow-700";
    case "j attendes":
      return "bg-blue-950/50 text-blue-400 border-blue-700";
    case "faux numero":
      return "bg-red-950/50 text-red-400 border-red-700";
    case "faux commande":
      return "bg-pink-950/50 text-pink-400 border-pink-700";
    case "ok":
      return "bg-green-950/50 text-green-400 border-green-700";
    case "reporte":
      return "bg-orange-950/50 text-orange-400 border-orange-700";
    case "pas seriux":
      return "bg-rose-950/50 text-rose-400 border-rose-700";
    case "occupe":
      return "bg-indigo-950/50 text-indigo-400 border-indigo-700";
    case "en voyage":
      return "bg-cyan-950/50 text-cyan-400 border-cyan-700";
    case "sms envoye":
      return "bg-teal-950/50 text-teal-400 border-teal-700";
    case "achete ailleurs":
      return "bg-fuchsia-950/50 text-fuchsia-400 border-fuchsia-700";
    case "annule":
      return "bg-red-950/50 text-red-400 border-red-700";
    default:
      return "bg-slate-950/50 text-slate-400 border-slate-700";
  }
}, []);

  // Vérifier si une commande a une note - mémorisé
  const hasNote = useCallback(
    (orderId: string) => {
      return notes.some((note) => note.orderId === orderId)
    },
    [notes],
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative w-full sm:max-w-xs">
            <div className="h-10 w-full bg-slate-800/50 rounded-md animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-slate-800/50 rounded-md animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-800/50 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <div className="h-[400px] w-full bg-slate-800/20 animate-pulse flex items-center justify-center">
            <span className="text-slate-500">Chargement des données...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Toaster />

      {/* Modal pour les notes */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
            <DialogDescription>Ajoutez une note pour la commande {currentOrderId}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Entrez votre note ici..."
                className="min-h-[150px] bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)} className="border-slate-700">
              Annuler
            </Button>
            <Button
              onClick={saveNote}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour les notes de suivi */}
      <Dialog open={isTrackingNoteModalOpen} onOpenChange={setIsTrackingNoteModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Ajouter une note de suivi</DialogTitle>
            <DialogDescription>
              Ajoutez une note pour le changement de statut de suivi vers "{currentTrackingNode}" pour la commande{" "}
              {currentOrderId}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trackingNote">Note (optionnelle)</Label>
              <Textarea
                id="trackingNote"
                value={trackingNoteText}
                onChange={(e) => setTrackingNoteText(e.target.value)}
                placeholder="Entrez votre note ici..."
                className="min-h-[100px] bg-slate-800/50 border-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrackingNoteModalOpen(false)} className="border-slate-700">
              Annuler
            </Button>
            <Button
              onClick={saveTrackingNote}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour les détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>Informations complètes sur la commande {selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-400">ID</Label>
                <div className="font-medium text-slate-300">{selectedOrder.id}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Tracking ID</Label>
                <div className="font-medium text-slate-300">{selectedOrder.trackingId}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Client</Label>
                <div className="font-medium text-slate-300">{selectedOrder.name}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Téléphone</Label>
                <div className="font-medium text-slate-300">{selectedOrder.phone}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Statut</Label>
                <div>
                  <Badge className="bg-amber-950/50 text-amber-400 border-amber-700" variant="outline">
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Statut SMS</Label>
                <div>
                  <Badge className={getSmsStatusColor(selectedOrder.smsStatus)} variant="outline">
                    {selectedOrder.smsStatus}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Type de livraison</Label>
                <div>
                  <Badge className={getDeliveryTypeColor(selectedOrder.deliveryType)} variant="outline">
                    {selectedOrder.deliveryType}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Société de livraison</Label>
                <div className="font-medium text-slate-300">{selectedOrder.deliveryCompany}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Confirmatrice</Label>
                <div className="font-medium text-slate-300">{selectedOrder.confirmatrice || "Non assigné"}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Wilaya</Label>
                <div className="font-medium text-slate-300">{selectedOrder.wilaya}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Commune</Label>
                <div className="font-medium text-slate-300">{selectedOrder.commune}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Adresse</Label>
                <div className="font-medium text-slate-300">{selectedOrder.address}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Articles</Label>
                <div className="font-medium text-slate-300">{selectedOrder.articles}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Prix de livraison</Label>
                <div className="font-medium text-slate-300">{selectedOrder.deliveryPrice} DA</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Prix total</Label>
                <div className="font-medium text-slate-300">{selectedOrder.totalPrice} DA</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Date</Label>
                <div className="font-medium text-slate-300">{selectedOrder.date}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Dernière mise à jour</Label>
                <div className="font-medium text-slate-300">{selectedOrder.lastUpdated}</div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-400">Informations de livraison</Label>
                <div className="font-medium text-slate-300">
                  {selectedOrder.deliveryInformation || "Aucune information"}
                </div>
              </div>
              {selectedOrder.pickupPoint && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-400">Point de relais</Label>
                  <div className="font-medium text-slate-300">{selectedOrder.pickupPoint}</div>
                </div>
              )}
              {selectedOrder.currentTrackingNode && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-400">Nœud de suivi</Label>
                  <div>
                    <Badge className={getTrackingNodeColor(selectedOrder.currentTrackingNode)} variant="outline">
                      {selectedOrder.currentTrackingNode}
                    </Badge>
                  </div>
                </div>
              )}
              {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-400">Historique de suivi</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrder.trackingHistory.map((history) => (
                      <div key={history.id} className="border border-slate-700 rounded p-2 bg-slate-800/30">
                        <div className="flex items-center justify-between">
                          <Badge className={getTrackingNodeColor(history.trackingNode)} variant="outline">
                            {history.trackingNode}
                          </Badge>
                          <span className="text-xs text-slate-500">{history.date}</span>
                        </div>
                        {history.note && <div className="mt-1 text-sm text-slate-400">{history.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasNote(selectedOrder.id) && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-400">Note</Label>
                  <div className="font-medium text-slate-300 p-3 bg-slate-800/50 rounded-md border border-slate-700">
                    {notes.find((note) => note.orderId === selectedOrder.id)?.text}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)} className="border-slate-700">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-full pl-8 bg-slate-800/50 border-slate-700 focus-visible:ring-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">


          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={moveToLivres}
                  disabled={selectedRows.length === 0}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  <span>Livrés</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer les commandes sélectionnées vers "Livrés"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={moveToRetour}
                  disabled={selectedRows.length === 0}
                  className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500"
                >
                  <PackageX className="h-4 w-4 mr-2" />
                  <span>Retour</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer les commandes sélectionnées vers "Retour"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
              >
                <Columns className="h-4 w-4 mr-2" />
                <span>Colonnes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
              <DropdownMenuLabel>Afficher les colonnes</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("trackingId")}
              >
                <Checkbox
                  checked={visibleColumns.trackingId}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>TrackingID</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("recipient")}
              >
                <Checkbox
                  checked={visibleColumns.recipient}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Destinataire</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("status")}
              >
                <Checkbox
                  checked={visibleColumns.status}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Statut</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("trackingNode")}
              >
                <Checkbox
                  checked={visibleColumns.trackingNode}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Nœud de suivi</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("sms")}
              >
                <Checkbox
                  checked={visibleColumns.sms}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>SMS</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("type")}
              >
                <Checkbox
                  checked={visibleColumns.type}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Type</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("wilaya")}
              >
                <Checkbox
                  checked={visibleColumns.wilaya}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Wilaya</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("commune")}
              >
                <Checkbox
                  checked={visibleColumns.commune}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Commune</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("deliveryCompany")}
              >
                <Checkbox
                  checked={visibleColumns.deliveryCompany}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Société de livraison</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("confirmatrice")}
              >
                <Checkbox
                  checked={visibleColumns.confirmatrice}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Confirmatrice</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("preparateur")}
              >
                <Checkbox
                  checked={visibleColumns.preparateur}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Préparateur</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("lastUpdated")}
              >
                <Checkbox
                  checked={visibleColumns.lastUpdated}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Dernière mise à jour</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                onClick={() => toggleColumnVisibility("sendReminder")}
              >
                <Checkbox
                  checked={visibleColumns.sendReminder}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Envoyer un rappel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select defaultValue="10">
            <SelectTrigger className="w-[80px] bg-slate-800/50 border-slate-700 focus:ring-cyan-500">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 p-3 rounded-md border border-slate-800 bg-slate-900/50">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-slate-400" />
          <span className="text-sm text-slate-400 mr-2">Filtres:</span>
        </div>

        <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Wilaya" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Toutes les wilayas</SelectItem>
            {wilayas.map((wilaya) => (
              <SelectItem key={wilaya} value={wilaya}>
                {wilaya}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Type de livraison" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Tous les types</SelectItem>
            {deliveryTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deliveryCompanyFilter} onValueChange={setDeliveryCompanyFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Société de livraison" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Toutes les sociétés</SelectItem>
            {deliveryCompanies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={trackingNodeFilter} onValueChange={setTrackingNodeFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Nœud de suivi" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Tous les nœuds</SelectItem>
            {trackingNodes.map((node) => (
              <SelectItem key={node} value={node}>
                {node}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="h-8 border-slate-700 bg-slate-800/50 text-slate-400"
        >
          Réinitialiser
        </Button>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="relative overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse">
  <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
          <tr className="border-b border-slate-800 text-xs text-slate-400">
            <th colSpan={100} className="p-2">
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <span>Filtres actifs :</span>

                {wilayaFilter !== "all" && <span className="px-2 py-1 rounded bg-slate-800 text-white text-xs">{wilayaFilter}</span>}
                {deliveryTypeFilter !== "all" && <span className="px-2 py-1 rounded bg-slate-800 text-white text-xs">{deliveryTypeFilter}</span>}
                {deliveryCompanyFilter !== "all" && <span className="px-2 py-1 rounded bg-slate-800 text-white text-xs">{deliveryCompanyFilter}</span>}
                {trackingNodeFilter !== "all" && <span className="px-2 py-1 rounded bg-slate-800 text-white text-xs">{trackingNodeFilter}</span>}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-6 border-slate-700 bg-slate-800/50 text-slate-400 ml-auto"
                >
                  Réinitialiser
                </Button>
              </div>
            </th>
          </tr>
          <tr>
            <th className="p-3 text-left text-slate-400 w-[40px]">
              <Checkbox
                checked={selectedRows.length > 0 && selectedRows.length === filteredOrders.length}
                onCheckedChange={handleSelectAll}
                className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
              />
            </th>
            {visibleColumns.trackingId && <th className="p-3 text-left text-slate-400">TrackingID</th>}
            {visibleColumns.recipient && <th className="p-3 text-left text-slate-400">Recipient</th>}
            {visibleColumns.status && <th className="p-3 text-left text-slate-400">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[130px] bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Status</SelectItem>
                  {statuses.map((status,id) => (
                    <SelectItem key={id} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </th>}
            {visibleColumns.articles && <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Articles</th>}
            {visibleColumns.trackingNode && <th className="p-3 text-left text-slate-400">
              <Select value={trackingNodeFilter} onValueChange={setTrackingNodeFilter}>
                <SelectTrigger className="h-8 w-[140px] bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Nœud de suivi" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Nœud de suivi</SelectItem>
                  {trackingNodes.map(node => (
                    <SelectItem key={node} value={node}>{node}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </th>}
            {visibleColumns.sms && <th className="p-3 text-left text-slate-400">SMS</th>}
            {visibleColumns.type && <th className="p-3 text-left text-slate-400">
              <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
                <SelectTrigger className="h-8 w-[120px] bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Type de livraison</SelectItem>
                  {deliveryTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </th>}
            {visibleColumns.wilaya && <th className="p-3 text-left text-slate-400">
              <Select value={wilayaFilter} onValueChange={setWilayaFilter}>
                <SelectTrigger className="h-8 w-[120px] bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Wilaya" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Wilaya</SelectItem>
                  {wilayas.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </th>}
            {visibleColumns.commune && <th className="p-3 text-left text-slate-400">Commune</th>}
            {visibleColumns.deliveryCompany && <th className="p-3 text-left text-slate-400">
              <Select value={deliveryCompanyFilter} onValueChange={setDeliveryCompanyFilter}>
                <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
                  <SelectValue placeholder="Société de livraison" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="all">Societie de livraison</SelectItem>
                  {deliveryCompanies.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </th>}
            {visibleColumns.confirmatrice && <th className="p-3 text-left text-slate-400">
              <Select value={confirmatriceFilter} onValueChange={setConfirmatriceFilter}>
                <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
              <SelectValue placeholder="Confirmatrice" />
            </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">Confirmatrice</SelectItem>
              {["non attribué", ...confirmatrices].map((confirmatrice) => (
                <SelectItem key={confirmatrice} value={confirmatrice}>
                  {confirmatrice === "" ? "non assigné" : confirmatrice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            </th>}
            {visibleColumns.preparateur && <th className="p-3 text-left text-slate-400">Préparateur</th>}
            {visibleColumns.lastUpdated && <th className="p-3 text-left text-slate-400">Last Updated</th>}
            {visibleColumns.sendReminder && <th className="p-3 text-left text-slate-400">Send Reminder</th>}
            <th className="p-3 text-right text-slate-400">Actions</th>
          </tr>
        </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
           <tr
  className={`border-b border-slate-800 `}
>
                    <td colSpan={14} className="text-center py-8 text-slate-400">
                      Aucune commande trouvée
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={cn(
                        "border-b border-slate-800 hover:bg-slate-800/50",
                        selectedRows.includes(order.id) && "bg-slate-800/30",
                    searchFilters.highlightOrder === order.id ? "ring-2 ring-cyan-500 bg-cyan-900/20" : ""
                    
                
                        
                      )}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedRows.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectRow(order.id, checked === true)}
                          className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                      </td>
                      {visibleColumns.trackingId && (
                        <td className="p-3 font-medium text-slate-300">{order.trackingId}</td>
                      )}
                      {visibleColumns.recipient && (
                        <td className="p-3 text-slate-300">
                          <div className="flex flex-col">
                            <span>{order.name}</span>
                            <span className="text-xs text-slate-400">{order.phone}</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="p-3 text-slate-300">
                          <Badge className="bg-amber-950/50 text-amber-400 border-amber-700" variant="outline">
                            {order?.lastStatus || "En livraison"}
                          </Badge>
                        </td>
                      )}
                                            {visibleColumns.articles && (
  <td className="p-3 text-slate-300">
  <HoverCard>
    <HoverCardTrigger className="cursor-pointer hover:text-cyan-400 transition-colors block truncate">
      {(() => {
        const allProducts = order.articles.map((article: { product_name: string }) => article.product_name).join(", ");
        return allProducts.length > 7 ? `${allProducts.substring(0, 7)}...` : allProducts;
      })()}
    </HoverCardTrigger>
    <HoverCardContent className="w-80 bg-slate-900 border-slate-800 p-0">
      <div className="p-3 border-b border-slate-800">
        <h4 className="text-sm font-medium text-slate-200">Détails des articles</h4>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <div className="p-3 space-y-2">
          {order.articles.map((article: any, index: number) => {
            const productTitle =
              `${article.product_name} ${article.variant_options?.option1 || ""} ${article.variant_options?.option2 || ""} (${article.quantity || ""})`.trim()
            return (
              <div key={index} className="p-2 bg-slate-800/50 rounded-md border border-slate-700">
                <div className="text-sm text-slate-200 font-medium">{article.product_name}</div>
                {(article.variant_options?.option1 || article.variant_options?.option2) && (
                  <div className="text-xs text-slate-400 mt-1">
                    Variante:{" "}
                    {[article.variant_options?.option1, article.variant_options?.option2]
                      .filter(Boolean)
                      .join(" / ")}
                  </div>
                )}
                {article.quantity && <div className="text-xs text-slate-400">Quantité: {article.quantity}</div>}
                {article.price && <div className="text-xs text-slate-400">Prix: {article.price}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</td>
)}
                      {visibleColumns.trackingNode && (
                        <td className="p-3 text-slate-300">
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="h-8 w-[180px] justify-between bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:text-slate-100"
                                >
                                  {order.currentTrackingNode ? (
                                    <Badge
                                      className={getTrackingNodeColor(order.currentTrackingNode)}
                                      variant="outline"
                                    >
                                      {order.currentTrackingNode}
                                    </Badge>
                                  ) : (
                                    <span className="text-slate-500">Non défini</span>
                                  )}
                                  <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[220px] bg-slate-900 border-slate-800">
                                <DropdownMenuLabel>Nœud de suivi</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                {trackingNodes.map((node) => (
                                  <DropdownMenuItem
                                    key={node}
                                    className="hover:bg-slate-800 focus:bg-slate-800 flex justify-between items-center"
                                  >
                                    <div
                                      className="flex-1 cursor-pointer"
                                      onClick={() => updateTrackingNode(order.id, node)}
                                    >
                                      <Badge className={getTrackingNodeColor(node)} variant="outline">
                                        {node}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openTrackingNoteModal(order.id, node)
                                      }}
                                    >
                                      <StickyNote className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      )}
                      {visibleColumns.sms && (
                        <td className="p-3 text-slate-300">
                          <Badge className={getSmsStatusColor(order.smsStatus)} variant="outline">
                            {order.smsStatus}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.type && (
                        <td className="p-3 text-slate-300">
                          <Badge className={getDeliveryTypeColor(order.deliveryType)} variant="outline">
                            {order.deliveryType}
                          </Badge>
                        </td>
                      )}
                      {visibleColumns.wilaya && <td className="p-3 text-slate-300">{order.wilaya}</td>}
                      {visibleColumns.commune && <td className="p-3 text-slate-300">{order.commune}</td>}
                      {visibleColumns.deliveryCompany && (
                        <td className="p-3 text-slate-300">{order.deliveryCompany}</td>
                      )}
                      {visibleColumns.confirmatrice && (
                        <td className="p-3 text-slate-300 group relative">
                          <div className="cursor-help">{order.confirmatrice || "Non assigné"}</div>
                          {order.confirmatrice && (
                            <div className="absolute z-50 invisible group-hover:visible bg-slate-900 border border-slate-800 rounded-md p-3 shadow-lg w-80 mt-1 left-0">
                              <h4 className="font-medium text-slate-300 mb-2">
                                Historique de suivi par {order.confirmatrice}
                              </h4>
                              {getTrackingHistoryForConfirmatrice(order.confirmatrice).length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {getTrackingHistoryForConfirmatrice(order.confirmatrice).map((history) => (
                                    <div key={history.id} className="border-b border-slate-800 pb-2">
                                      <div className="flex items-center justify-between">
                                        <Badge className={getTrackingNodeColor(history.trackingNode)} variant="outline">
                                          {history.trackingNode}
                                        </Badge>
                                        <span className="text-xs text-slate-500">{history.date}</span>
                                      </div>
                                      {history.note && (
                                        <div className="mt-1 text-sm text-slate-400 bg-slate-800/50 p-1 rounded">
                                          {history.note}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">Aucun historique de suivi</p>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.preparateur && (
                        <td className="p-3 text-slate-300">{order.additionalInfo || "Non assigné"}</td>
                      )}
                      {visibleColumns.lastUpdated && (
                        <td className="p-3 text-slate-300">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
<span>
  {order?.lastUpdated
    ? new Date(order.lastUpdated.seconds * 1000).toLocaleString("fr-DZ", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A"}
</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.sendReminder && (
                        <td className="p-3 text-slate-300">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(order.id)}
                            className="border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span>SMS</span>
                          </Button>
                        </td>
                      )}
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              window.open(`https://wa.me/${formatPhoneForWhatsApp(order.phone)}`, "_blank")
                            }
                            className="text-green-400 hover:text-green-300 hover:bg-slate-800"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="sr-only">WhatsApp</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleSelectRow(order.id, true)
                              updateMultipleOrdersStatus([order.id], "Livrés")
                              toast({
                                title: "Commande déplacée",
                                description: `La commande ${order.trackingId} a été déplacée vers "Livrés".`,
                              })
                            }}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                          >
                            <ArrowRight className="h-4 w-4" />
                            <span className="sr-only">Déplacer vers Livrés</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleSelectRow(order.id, true)
                              updateMultipleOrdersStatus([order.id], "Retour")
                              toast({
                                title: "Commande déplacée",
                                description: `La commande ${order.trackingId} a été déplacée vers "Retour".`,
                              })
                            }}
                            className="text-rose-400 hover:text-rose-300 hover:bg-slate-800"
                          >
                            <PackageX className="h-4 w-4" />
                            <span className="sr-only">Déplacer vers Retour</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-slate-800" />
                              <DropdownMenuItem
                                className="hover:bg-slate-800 focus:bg-slate-800"
                                onClick={() => openDetailsModal(order)}
                              >
                                <Package className="mr-2 h-4 w-4" />
                                <span>Détails</span>
                              </DropdownMenuItem>
  
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" disabled className="border-slate-700 bg-slate-800/50 text-slate-400">
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
