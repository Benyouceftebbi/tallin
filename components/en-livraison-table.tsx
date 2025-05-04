"use client"

import { useState, useCallback, useMemo } from "react"
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
import { isWithinInterval, parseISO } from "date-fns"

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
  "En transit",
  "Arrivé au hub",
  "En cours de livraison",
  "Tentative échouée",
  "Reporté",
  "Prêt à livrer",
]

// Type pour les notes
type OrderNote = {
  id: string
  orderId: string
  text: string
  date: string
  author: string
  trackingNode?: TrackingNode // Ajouter le nœud de suivi associé
}

// Type pour l'historique de suivi
type TrackingHistory = {
  id: string
  orderId: string
  trackingNode: TrackingNode
  date: string
  author: string
  note?: string
}

export function EnLivraisonTable() {
  const { getOrdersByStatus, updateMultipleOrdersStatus, sendSmsReminder, updateOrder, loading } = useShop()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // États pour les filtres
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all")
  const [deliveryCompanyFilter, setDeliveryCompanyFilter] = useState<string>("all")
  const [trackingNodeFilter, setTrackingNodeFilter] = useState<string>("all")

  // États pour la modal de notes
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string>("")
  const [noteText, setNoteText] = useState<string>("")

  // États pour la modal de détails
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // État pour stocker les notes (dans un cas réel, cela viendrait d'une API)
  const [notes, setNotes] = useState<OrderNote[]>([])

  // État pour stocker les nœuds de suivi des commandes (dans un cas réel, cela viendrait d'une API)
  const [orderTrackingNodes, setOrderTrackingNodes] = useState<Record<string, TrackingNode>>({})

  // État pour stocker l'historique de suivi (dans un cas réel, cela viendrait d'une API)
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
    trackingNode: true, // Ajouter le nœud de suivi
    sms: true,
    type: true,
    wilaya: true,
    commune: true,
    deliveryCompany: true,
    confirmatrice: true,
    preparateur: true,
    lastUpdated: true,
    sendReminder: true,
  })

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }))
  }

  // Obtenir les commandes - mémorisé
  const orders = useMemo(() => getOrdersByStatus("En livraison"), [getOrdersByStatus])

  // Obtenir les listes uniques pour les filtres - mémorisées
  const wilayas = useMemo(() => Array.from(new Set(orders.map((order) => order.wilaya))), [orders])
  const deliveryTypes = useMemo(() => Array.from(new Set(orders.map((order) => order.deliveryType))), [orders])
  const deliveryCompanies = useMemo(() => Array.from(new Set(orders.map((order) => order.deliveryCompany))), [orders])

  // Filtrer les commandes - mémorisé
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesWilaya = wilayaFilter === "all" || order.wilaya === wilayaFilter
      const matchesDeliveryType = deliveryTypeFilter === "all" || order.deliveryType === deliveryTypeFilter
      const matchesDeliveryCompany = deliveryCompanyFilter === "all" || order.deliveryCompany === deliveryCompanyFilter
      const matchesTrackingNode = trackingNodeFilter === "all" || orderTrackingNodes[order.id] === trackingNodeFilter

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
          // If date parsing fails, we'll still include the order
          console.error("Error parsing date:", error)
        }
      }

      return (
        matchesSearch &&
        matchesWilaya &&
        matchesDeliveryType &&
        matchesDeliveryCompany &&
        matchesTrackingNode &&
        matchesDateRange
      )
    })
  }, [
    orders,
    searchTerm,
    wilayaFilter,
    deliveryTypeFilter,
    deliveryCompanyFilter,
    trackingNodeFilter,
    orderTrackingNodes,
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
      // Trouver la note existante pour cette commande
      const existingNote = notes.find((note) => note.orderId === orderId)
      setNoteText(existingNote?.text || "")
      setIsNoteModalOpen(true)
    },
    [notes],
  )

  // Ouvrir la modal de détails - mémorisé
  const openDetailsModal = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }, [])

  // Sauvegarder une note - mémorisé
  const saveNote = useCallback(() => {
    if (!noteText.trim()) {
      toast({
        title: "Note vide",
        description: "Veuillez entrer une note avant de sauvegarder.",
        variant: "destructive",
      })
      return
    }

    // Vérifier si une note existe déjà pour cette commande
    const existingNoteIndex = notes.findIndex((note) => note.orderId === currentOrderId)

    if (existingNoteIndex >= 0) {
      // Mettre à jour la note existante
      const updatedNotes = [...notes]
      updatedNotes[existingNoteIndex] = {
        ...updatedNotes[existingNoteIndex],
        text: noteText,
        date: new Date().toLocaleString("fr-FR"),
      }
      setNotes(updatedNotes)
    } else {
      // Créer une nouvelle note
      const newNote: OrderNote = {
        id: `note-${Date.now()}`,
        orderId: currentOrderId,
        text: noteText,
        date: new Date().toLocaleString("fr-FR"),
        author: "Utilisateur actuel", // Dans un cas réel, cela viendrait de l'authentification
      }
      setNotes((prev) => [...prev, newNote])
    }

    toast({
      title: "Note sauvegardée",
      description: "La note a été sauvegardée avec succès.",
    })

    setIsNoteModalOpen(false)
    setNoteText("")
    setCurrentOrderId("")
  }, [currentOrderId, noteText, notes])

  // Mettre à jour le nœud de suivi d'une commande - mémorisé
  const updateTrackingNode = useCallback((orderId: string, node: TrackingNode, note?: string) => {
    setOrderTrackingNodes((prev) => ({
      ...prev,
      [orderId]: node,
    }))

    // Ajouter à l'historique de suivi
    const newHistoryEntry: TrackingHistory = {
      id: `history-${Date.now()}`,
      orderId,
      trackingNode: node,
      date: new Date().toLocaleString("fr-FR"),
      author: "Utilisateur actuel", // Dans un cas réel, cela viendrait de l'authentification
      note,
    }

    setTrackingHistory((prev) => [...prev, newHistoryEntry])

    // Dans un cas réel, vous appelleriez une API pour mettre à jour le nœud de suivi
    toast({
      title: "Nœud de suivi mis à jour",
      description: `Le nœud de suivi de la commande ${orderId} a été mis à jour.`,
    })
  }, [])

  // Ouvrir la modal de notes de suivi
  const openTrackingNoteModal = useCallback((orderId: string, node: TrackingNode) => {
    setCurrentOrderId(orderId)
    setCurrentTrackingNode(node)
    setTrackingNoteText("")
    setIsTrackingNoteModalOpen(true)
  }, [])

  // Sauvegarder une note de suivi
  const saveTrackingNote = useCallback(() => {
    if (!currentTrackingNode) return

    updateTrackingNode(currentOrderId, currentTrackingNode, trackingNoteText.trim() || undefined)

    setIsTrackingNoteModalOpen(false)
    setTrackingNoteText("")
    setCurrentOrderId("")
    setCurrentTrackingNode(null)
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
        const order = orders.find((o) => o.id === history.orderId)
        return order?.confirmatrice === confirmatrice
      })
    },
    [trackingHistory, orders],
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
    // Supprimer tous les caractères non numériques
    const cleanPhone = phone.replace(/\D/g, "")

    // Si le numéro commence par 0, le remplacer par 213 (code pays Algérie)
    if (cleanPhone.startsWith("0")) {
      return "213" + cleanPhone.substring(1)
    }

    // Si le numéro ne commence pas par 213, ajouter 213
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

  // Obtenir la couleur du badge pour le nœud de suivi - mémorisé
  const getTrackingNodeColor = useCallback((node: TrackingNode | undefined) => {
    switch (node) {
      case "En transit":
        return "bg-blue-950/50 text-blue-400 border-blue-700"
      case "Arrivé au hub":
        return "bg-purple-950/50 text-purple-400 border-purple-700"
      case "En cours de livraison":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      case "Tentative échouée":
        return "bg-red-950/50 text-red-400 border-red-700"
      case "Reporté":
        return "bg-orange-950/50 text-orange-400 border-orange-700"
      case "Prêt à livrer":
        return "bg-green-950/50 text-green-400 border-green-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }, [])

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
              {orderTrackingNodes[selectedOrder.id] && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-400">Nœud de suivi</Label>
                  <div>
                    <Badge className={getTrackingNodeColor(orderTrackingNodes[selectedOrder.id])} variant="outline">
                      {orderTrackingNodes[selectedOrder.id]}
                    </Badge>
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
                  variant="outline"
                  size="sm"
                  onClick={moveBackToDispatcher}
                  disabled={selectedRows.length === 0}
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  <span>Dispatcher</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer les commandes sélectionnées vers "Dispatcher"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                <tr className="border-b border-slate-800">
                  <th className="p-3 text-left text-slate-400 w-[40px]">
                    <Checkbox
                      checked={selectedRows.length > 0 && selectedRows.length === filteredOrders.length}
                      onCheckedChange={handleSelectAll}
                      className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                  </th>
                  {visibleColumns.trackingId && <th className="p-3 text-left text-slate-400">TrackingID</th>}
                  {visibleColumns.recipient && <th className="p-3 text-left text-slate-400">Recipient</th>}
                  {visibleColumns.status && <th className="p-3 text-left text-slate-400">Status</th>}
                  {visibleColumns.trackingNode && <th className="p-3 text-left text-slate-400">Nœud de suivi</th>}
                  {visibleColumns.sms && <th className="p-3 text-left text-slate-400">SMS</th>}
                  {visibleColumns.type && <th className="p-3 text-left text-slate-400">Type</th>}
                  {visibleColumns.wilaya && <th className="p-3 text-left text-slate-400">Wilaya</th>}
                  {visibleColumns.commune && <th className="p-3 text-left text-slate-400">Commune</th>}
                  {visibleColumns.deliveryCompany && (
                    <th className="p-3 text-left text-slate-400">Société de livraison</th>
                  )}
                  {visibleColumns.confirmatrice && <th className="p-3 text-left text-slate-400">Confirmatrice</th>}
                  {visibleColumns.preparateur && <th className="p-3 text-left text-slate-400">Préparateur</th>}
                  {visibleColumns.lastUpdated && <th className="p-3 text-left text-slate-400">Last Updated</th>}
                  {visibleColumns.sendReminder && <th className="p-3 text-left text-slate-400">Send Reminder</th>}
                  <th className="p-3 text-right text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr className="border-b border-slate-800">
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
                            {order.status}
                          </Badge>
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
                                  {orderTrackingNodes[order.id] ? (
                                    <Badge
                                      className={getTrackingNodeColor(orderTrackingNodes[order.id])}
                                      variant="outline"
                                    >
                                      {orderTrackingNodes[order.id]}
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
                            <span>{order.lastUpdated}</span>
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
                              <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Changer le statut</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-800" />
                              <DropdownMenuItem
                                className="hover:bg-slate-800 focus:bg-slate-800"
                                onClick={() => {
                                  handleSelectRow(order.id, true)
                                  updateMultipleOrdersStatus([order.id], "Dispatcher")
                                  toast({
                                    title: "Commande déplacée",
                                    description: `La commande ${order.trackingId} a été déplacée vers "Dispatcher".`,
                                  })
                                }}
                              >
                                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                                <span>Retour vers Dispatcher</span>
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
