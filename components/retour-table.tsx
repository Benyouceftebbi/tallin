"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  CheckCircle,
  MoreHorizontal,
  Package,
  Search,
  MessageSquare,
  Clock,
  Barcode,
  ArrowRight,
  Filter,
  StickyNote,
  TruckIcon,
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
import { useShop, type DeliveryType, type SmsStatus, type RetourType, type Order } from "@/context/shop-context"
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
import type { DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO } from "date-fns"

// Type pour les notes
type OrderNote = {
  id: string
  orderId: string
  text: string
  date: string
  author: string
}

export function RetourTable() {
  const { getOrdersByStatus, sendSmsReminder, loading, updateRetourStatus } = useShop()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<RetourType>("Retour")
  const [barcodeValue, setBarcodeValue] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)

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

  // Obtenir les commandes
  const orders = useMemo(() => getOrdersByStatus("Retour"), [getOrdersByStatus])

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

  // Focus sur l'input de code-barres au chargement
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [activeTab])

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

      const matchesRetourType = order.retourType === activeTab

      return (
        matchesSearch &&
        matchesWilaya &&
        matchesCommune &&
        matchesDeliveryType &&
        matchesDeliveryCompany &&
        matchesConfirmatrice &&
        matchesPreparateur &&
        matchesRetourType &&
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
    activeTab,
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

  // Gérer le scan de code-barres
  const handleBarcodeSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!barcodeValue.trim()) {
        toast({
          title: "Code-barres vide",
          description: "Veuillez scanner un code-barres valide.",
          variant: "destructive",
        })
        return
      }

      // Rechercher la commande par trackingId
      const order = orders.find((o) => o.trackingId === barcodeValue.trim() && o.retourType === activeTab)

      if (order) {
        // Sélectionner la commande
        if (!selectedRows.includes(order.id)) {
          setSelectedRows((prev) => [...prev, order.id])
          toast({
            title: "Colis sélectionné",
            description: `Le colis ${order.trackingId} a été sélectionné.`,
          })
        } else {
          toast({
            title: "Colis déjà sélectionné",
            description: `Le colis ${order.trackingId} est déjà sélectionné.`,
          })
        }
      } else {
        toast({
          title: "Code-barres non trouvé",
          description: `Aucun colis avec le code-barres ${barcodeValue} trouvé dans l'onglet actuel.`,
          variant: "destructive",
        })
      }

      setBarcodeValue("")

      // Refocus sur l'input
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    },
    [barcodeValue, orders, activeTab, selectedRows],
  )

  // Marquer les colis sélectionnés comme "Retour chez le vendeur"
  const handleRetourChezVendeur = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucun colis sélectionné",
        description: "Veuillez sélectionner au moins un colis.",
        variant: "destructive",
      })
      return
    }

    // Mettre à jour le statut des colis sélectionnés
    selectedRows.forEach((id) => {
      updateRetourStatus(id, "Retour chez le vendeur")
    })

    toast({
      title: "Statut mis à jour",
      description: `${selectedRows.length} colis ont été marqués comme "Retour chez le vendeur".`,
    })

    // Réinitialiser la sélection
    setSelectedRows([])
  }, [selectedRows, updateRetourStatus])

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

  // Naviguer vers une page spécifique
  const navigateToRetourType = useCallback((type: RetourType) => {
    setActiveTab(type)
    setSelectedRows([])
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

  // Obtenir la couleur du badge pour le type de retour
  const getRetourTypeColor = useCallback((type: RetourType) => {
    switch (type) {
      case "Retour":
        return "bg-rose-950/50 text-rose-400 border-rose-700"
      case "Retour chez le vendeur":
        return "bg-orange-950/50 text-orange-400 border-orange-700"
      case "Retour encaissé":
        return "bg-green-950/50 text-green-400 border-green-700"
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
                <Label className="text-slate-400">Type de retour</Label>
                <div>
                  <Badge className={getRetourTypeColor(selectedOrder.retourType || "Retour")} variant="outline">
                    {selectedOrder.retourType}
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

      {/* En-têtes de statut cliquables */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeTab === "Retour" ? "default" : "outline"}
          size="sm"
          onClick={() => navigateToRetourType("Retour")}
          className={cn(
            activeTab === "Retour"
              ? "bg-rose-950/50 text-rose-400 border-rose-700 hover:bg-rose-900/50"
              : "bg-slate-800/50 text-slate-400 border-slate-700",
          )}
        >
          Retour
        </Button>
        <Button
          variant={activeTab === "Retour chez le vendeur" ? "default" : "outline"}
          size="sm"
          onClick={() => navigateToRetourType("Retour chez le vendeur")}
          className={cn(
            activeTab === "Retour chez le vendeur"
              ? "bg-orange-950/50 text-orange-400 border-orange-700 hover:bg-orange-900/50"
              : "bg-slate-800/50 text-slate-400 border-slate-700",
          )}
        >
          Retour chez le vendeur
        </Button>
        <Button
          variant={activeTab === "Retour encaissé" ? "default" : "outline"}
          size="sm"
          onClick={() => navigateToRetourType("Retour encaissé")}
          className={cn(
            activeTab === "Retour encaissé"
              ? "bg-green-950/50 text-green-400 border-green-700 hover:bg-green-900/50"
              : "bg-slate-800/50 text-slate-400 border-slate-700",
          )}
        >
          Retour encaissé
        </Button>
      </div>

      {/* Scanner de code-barres */}
      <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mb-4">
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
          <ArrowRight className="h-4 w-4 mr-2" />
          Scanner
        </Button>
      </form>

      {/* Bouton pour marquer les colis sélectionnés comme "Retour chez le vendeur" */}
      {activeTab === "Retour" && selectedRows.length > 0 && (
        <div className="mb-4">
          <Button
            onClick={handleRetourChezVendeur}
            className="bg-orange-950/50 text-orange-400 border-orange-700 hover:bg-orange-900/50"
          >
            <TruckIcon className="h-4 w-4 mr-2" />
            Retour chez le vendeur ({selectedRows.length})
          </Button>
        </div>
      )}

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
                <th className="p-3 text-left text-slate-400">TrackingID</th>
                <th className="p-3 text-left text-slate-400">Recipient</th>
                <th className="p-3 text-left text-slate-400">Status</th>
                <th className="p-3 text-left text-slate-400">SMS</th>
                <th className="p-3 text-left text-slate-400">Type</th>
                <th className="p-3 text-left text-slate-400">Wilaya</th>
                <th className="p-3 text-left text-slate-400">Commune</th>
                <th className="p-3 text-left text-slate-400">Société de livraison</th>
                <th className="p-3 text-left text-slate-400">Confirmatrice</th>
                <th className="p-3 text-left text-slate-400">Préparateur</th>
                <th className="p-3 text-left text-slate-400">Note</th>
                <th className="p-3 text-left text-slate-400">Last Updated</th>
                <th className="p-3 text-left text-slate-400">Send Reminder</th>
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
                    <td className="p-3 font-medium text-slate-300">{order.trackingId}</td>
                    <td className="p-3 text-slate-300">
                      <div className="flex flex-col">
                        <span>{order.name}</span>
                        <span className="text-xs text-slate-400">{order.phone}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <Badge className={getRetourTypeColor(order.retourType || "Retour")} variant="outline">
                        {order.retourType}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">
                      <Badge className={getSmsStatusColor(order.smsStatus)} variant="outline">
                        {order.smsStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">
                      <Badge className={getDeliveryTypeColor(order.deliveryType)} variant="outline">
                        {order.deliveryType}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-300">{order.wilaya}</td>
                    <td className="p-3 text-slate-300">{order.commune}</td>
                    <td className="p-3 text-slate-300">{order.deliveryCompany}</td>
                    <td className="p-3 text-slate-300">{order.confirmatrice || "Non assigné"}</td>
                    <td className="p-3 text-slate-300">{order.additionalInfo || "Non assigné"}</td>
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
                    <td className="p-3 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{order.lastUpdated}</span>
                      </div>
                    </td>
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
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {activeTab === "Retour" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateRetourStatus(order.id, "Retour chez le vendeur")
                              toast({
                                title: "Statut mis à jour",
                                description: `Le colis ${order.trackingId} a été marqué comme "Retour chez le vendeur".`,
                              })
                            }}
                            className="text-orange-400 hover:text-orange-300 hover:bg-slate-800"
                          >
                            <TruckIcon className="h-4 w-4" />
                            <span className="sr-only">Retour chez le vendeur</span>
                          </Button>
                        )}
                        {activeTab === "Retour chez le vendeur" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              updateRetourStatus(order.id, "Retour encaissé")
                              toast({
                                title: "Statut mis à jour",
                                description: `Le colis ${order.trackingId} a été marqué comme "Retour encaissé".`,
                              })
                            }}
                            className="text-green-400 hover:text-green-300 hover:bg-slate-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Encaisser</span>
                          </Button>
                        )}
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
