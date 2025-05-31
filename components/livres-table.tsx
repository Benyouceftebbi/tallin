"use client"

import { useState, useCallback, useMemo } from "react"
import {
  CheckCircle,
  MoreHorizontal,
  Package,
  Search,
  MessageSquare,
  Clock,
  Filter,
  StickyNote,
  ArrowRight,
  Columns,
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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useShop, type DeliveryType, type SmsStatus, type Order } from "@/context/shop-context"
import { cn } from "@/lib/utils"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO } from "date-fns"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card"

// Type pour les notes
type OrderNote = {
  id: string
  orderId: string
  text: string
  date: string
  author: string
}

export function LivresTable() {
  const { getOrdersByStatus, sendSmsReminder, loading, updateMultipleOrdersStatus } = useShop()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // États pour les filtres
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")
  const [communeFilter, setCommuneFilter] = useState<string>("all")
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all")
  const [deliveryCompanyFilter, setDeliveryCompanyFilter] = useState<string>("all")
  const [confirmatriceFilter, setConfirmatriceFilter] = useState<string>("all")
  const [preparateurFilter, setPreparateurFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // États pour la modal de notes
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string>("")
  const [noteText, setNoteText] = useState<string>("")

  // États pour la modal de détails
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // État pour stocker les notes (dans un cas réel, cela viendrait d'une API)
  const [notes, setNotes] = useState<OrderNote[]>([])

  // État pour la visibilité des colonnes
  const [visibleColumns, setVisibleColumns] = useState({
    trackingId: true,
    recipient: true,
    status: true,
    sms: true,
    type: true,
    wilaya: true,
    commune: true,
    deliveryCompany: true,
    confirmatrice: true,
    preparateur: true,
    note: true,
    lastUpdated: true,
    sendReminder: true,
  })

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }, [])

  // Obtenir les commandes
  const orders = useMemo(() => getOrdersByStatus("Livrés"), [getOrdersByStatus])

  // Obtenir les listes uniques pour les filtres
  const wilayas = useMemo(() => Array.from(new Set(orders.map((order) => order.wilaya))), [orders])
  const communes = useMemo(() => Array.from(new Set(orders.map((order) => order.commune))), [orders])
  const deliveryTypes = useMemo(() => Array.from(new Set(orders.map((order) => order.deliveryType))), [orders])
  const deliveryCompanies = useMemo(() => Array.from(new Set(orders.map((order) => order.deliveryCompany))), [orders])
  const confirmatrices = useMemo(
    () => Array.from(new Set(orders.map((order) => order.confirmatrice).filter(Boolean))),
    [orders],
  )
  const preparateurs = useMemo(
    () => Array.from(new Set(orders.map((order) => order.additionalInfo).filter(Boolean))),
    [orders],
  )

  // Filtrer les commandes en fonction des critères
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesWilaya = wilayaFilter === "all" || order.wilaya === wilayaFilter
      const matchesCommune = communeFilter === "all" || order.commune === communeFilter
      const matchesDeliveryType = deliveryTypeFilter === "all" || order.deliveryType === deliveryTypeFilter
      const matchesDeliveryCompany = deliveryCompanyFilter === "all" || order.deliveryCompany === deliveryCompanyFilter
      const matchesConfirmatrice = confirmatriceFilter === "all" || order.confirmatrice === confirmatriceFilter
      const matchesPreparateur = preparateurFilter === "all" || order.additionalInfo === preparateurFilter

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
        matchesCommune &&
        matchesDeliveryType &&
        matchesDeliveryCompany &&
        matchesConfirmatrice &&
        matchesPreparateur &&
        matchesDateRange
      )
    })
  }, [
    orders,
    searchTerm,
    wilayaFilter,
    communeFilter,
    deliveryTypeFilter,
    deliveryCompanyFilter,
    confirmatriceFilter,
    preparateurFilter,
    dateRange,
  ])

  // Gérer la sélection de toutes les lignes
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

  // Gérer la sélection d'une ligne
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id])
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    }
  }, [])

  // Envoyer un SMS de rappel
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

  // Ouvrir la modal de notes
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

  // Ouvrir la modal de détails
  const openDetailsModal = useCallback((order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }, [])

  // Sauvegarder une note
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

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setWilayaFilter("all")
    setCommuneFilter("all")
    setDeliveryTypeFilter("all")
    setDeliveryCompanyFilter("all")
    setConfirmatriceFilter("all")
    setPreparateurFilter("all")
    setDateRange(undefined)
  }, [])

  // Obtenir la couleur du badge pour le statut SMS
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

  // Obtenir la couleur du badge pour le type de livraison
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

  // Vérifier si une commande a une note
  const hasNote = useCallback(
    (orderId: string) => {
      return notes.some((note) => note.orderId === orderId)
    },
    [notes],
  )

  // Déplacer les commandes sélectionnées vers "En livraison"
  const moveBackToEnLivraison = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "En livraison")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "En livraison".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])

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
                  <Badge className="bg-cyan-950/50 text-cyan-400 border-cyan-700" variant="outline">
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
                <Label className="text-slate-400">Préparateur</Label>
                <div className="font-medium text-slate-300">{selectedOrder.additionalInfo || "Non assigné"}</div>
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
                  onClick={moveBackToEnLivraison}
                  disabled={selectedRows.length === 0}
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                  <span>En livraison</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer les commandes sélectionnées vers "En livraison"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Column visibility dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 text-slate-300">
                <Columns className="h-4 w-4 mr-2" />
                <span>Colonnes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-800">
              <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.trackingId}
                onCheckedChange={() => toggleColumnVisibility("trackingId")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                TrackingID
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.recipient}
                onCheckedChange={() => toggleColumnVisibility("recipient")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Destinataire
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={() => toggleColumnVisibility("status")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Statut
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.sms}
                onCheckedChange={() => toggleColumnVisibility("sms")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                SMS
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.type}
                onCheckedChange={() => toggleColumnVisibility("type")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Type
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.wilaya}
                onCheckedChange={() => toggleColumnVisibility("wilaya")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Wilaya
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.commune}
                onCheckedChange={() => toggleColumnVisibility("commune")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Commune
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryCompany}
                onCheckedChange={() => toggleColumnVisibility("deliveryCompany")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Société de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.confirmatrice}
                onCheckedChange={() => toggleColumnVisibility("confirmatrice")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Confirmatrice
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.preparateur}
                onCheckedChange={() => toggleColumnVisibility("preparateur")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Préparateur
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.note}
                onCheckedChange={() => toggleColumnVisibility("note")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Note
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.lastUpdated}
                onCheckedChange={() => toggleColumnVisibility("lastUpdated")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Dernière mise à jour
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.sendReminder}
                onCheckedChange={() => toggleColumnVisibility("sendReminder")}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Envoyer rappel
              </DropdownMenuCheckboxItem>
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

        <Select value={communeFilter} onValueChange={setCommuneFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Commune" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Toutes les communes</SelectItem>
            {communes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
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

        <Select value={confirmatriceFilter} onValueChange={setConfirmatriceFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Confirmatrice" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Toutes les confirmatrices</SelectItem>
            {confirmatrices.map((confirmatrice) => (
              <SelectItem key={confirmatrice} value={confirmatrice}>
                {confirmatrice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={preparateurFilter} onValueChange={setPreparateurFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Préparateur" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Tous les préparateurs</SelectItem>
            {preparateurs.map((preparateur) => (
              <SelectItem key={preparateur} value={preparateur}>
                {preparateur}
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

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-x-auto">
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
                {visibleColumns.articles && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Articles</th>
                  )}
                {visibleColumns.sms && <th className="p-3 text-left text-slate-400">SMS</th>}
                {visibleColumns.type && <th className="p-3 text-left text-slate-400">Type</th>}
                {visibleColumns.wilaya && <th className="p-3 text-left text-slate-400">Wilaya</th>}
                {visibleColumns.commune && <th className="p-3 text-left text-slate-400">Commune</th>}
                {visibleColumns.deliveryCompany && (
                  <th className="p-3 text-left text-slate-400">Société de livraison</th>
                )}
                {visibleColumns.confirmatrice && <th className="p-3 text-left text-slate-400">Confirmatrice</th>}
                {visibleColumns.preparateur && <th className="p-3 text-left text-slate-400">Préparateur</th>}
                {visibleColumns.note && <th className="p-3 text-left text-slate-400">Note</th>}
                {visibleColumns.lastUpdated && <th className="p-3 text-left text-slate-400">Last Updated</th>}
                {visibleColumns.sendReminder && <th className="p-3 text-left text-slate-400">Send Reminder</th>}
                <th className="p-3 text-right text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr className="border-b border-slate-800">
                  <td colSpan={15} className="text-center py-8 text-slate-400">
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
                        <Badge className="bg-cyan-950/50 text-cyan-400 border-cyan-700" variant="outline">
                          {order.status}
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
                    {visibleColumns.deliveryCompany && <td className="p-3 text-slate-300">{order.deliveryCompany}</td>}
                    {visibleColumns.confirmatrice && (
                      <td className="p-3 text-slate-300">{order.confirmatrice || "Non assigné"}</td>
                    )}
                    {visibleColumns.preparateur && (
                      <td className="p-3 text-slate-300">{order.additionalInfo || "Non assigné"}</td>
                    )}
                    {visibleColumns.note && (
                      <td className="p-3 text-slate-300">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNoteModal(order.id)}
                          className={cn(
                            "border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:text-slate-100",
                            hasNote(order.id) &&
                              "border-cyan-700 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 hover:text-cyan-300",
                          )}
                        >
                          <StickyNote className="h-4 w-4 mr-1" />
                          <span>{hasNote(order.id) ? "Voir note" : "Ajouter"}</span>
                        </Button>
                      </td>
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
                            <DropdownMenuItem
                              className="hover:bg-slate-800 focus:bg-slate-800"
                              onClick={() => {
                                handleSelectRow(order.id, true)
                                updateMultipleOrdersStatus([order.id], "En livraison")
                                toast({
                                  title: "Commande déplacée",
                                  description: `La commande a été déplacée vers "En livraison".`,
                                })
                              }}
                            >
                              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                              <span>Retour vers En livraison</span>
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
