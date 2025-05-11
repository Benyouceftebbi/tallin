"use client"

import { useState, useCallback, useMemo } from "react"
import {
  CheckCircle,
  MoreHorizontal,
  Package,
  Search,
  Edit,
  Plus,
  Filter,
  Trash2,
  UserCheck,
  Columns,
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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useShop, type Order, type DeliveryType, type ConfirmationStatus } from "@/context/shop-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { OrderEditModal } from "@/components/order-edit-modal"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateRangePicker, type DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO } from "date-fns"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
  getAllWilayas,
  getCommunesByWilayaName,
  normalizeString,
} from "@/app/admin/commandes/en-attente/data/algeria-regions"
import { isStopDeskAvailable } from "@/app/admin/commandes/en-attente/data/shipping-availability"
import { getYalidinCentersForCommune } from "@/app/admin/commandes/en-attente/data/yalidin-centers"
import { useAuth } from "@/context/auth-context"

export function EnAttenteTable() {
  const {
    getOrdersByStatus,
    updateMultipleOrdersStatus,
    updateOrder,
    loading,
    updateConfirmationStatus,
    deliveryCompanies, // Assuming this comes from the shop context
    deliveryCenters,
    workers,
    orders, // Assuming this comes from the shop context
  } = useShop()
  const {userRole}=useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isConfirmatriceModalOpen, setIsConfirmatriceModalOpen] = useState(false)
  const [selectedConfirmatrice, setSelectedConfirmatrice] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Filtres
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")
  const [communeFilter, setCommuneFilter] = useState<string>("all")
  const [deliveryCompanyFilter, setDeliveryCompanyFilter] = useState<string>("all")
  const [deliveryCenterFilter, setDeliveryCenterFilter] = useState<string>("all") // New filter for delivery center
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [confirmatriceFilter, setConfirmatriceFilter] = useState<string>("all")
  const [articleFilter, setArticleFilter] = useState<string>("all")

  // Colonnes visibles
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    date: true,
    name: true,
    phone: true,
    articles: true,
    wilaya: true,
    commune: true,
    deliveryType: true,
    deliveryCompany: true, // Renamed from "entreprise"
    deliveryCenter: true, // New column
    status: true,
    pickupPoint: false,
    deliveryPrice: true,
    address: false,
    additionalInfo: false,
    confirmatrice: true,
    totalPrice: true,
    source: true,
  })

  // Filtrer pour n'avoir que les commandes en attente
  const ordersWait = useMemo(() => {
    console.log("ghiihi");
    
    return orders.filter((order) => order.status === "en-attente")
  }, [orders])

  // Obtenir les listes uniques pour les filtres - mémorisées pour éviter des recalculs
  const wilayas = getAllWilayas().sort((a, b) => a.name_ascii.localeCompare(b.name_ascii))

  const deliveryCompanyList = useMemo(
    () => Array.from(new Set(ordersWait.map((order) => order.deliveryCompany))),
    [ordersWait],
  )
  const deliveryCenterList = useMemo(
    () => Array.from(new Set(ordersWait.map((order) => order.deliveryCenter || ""))),
    [ordersWait],
  )
  const deliveryTypes = ["stopdesk", "domicile"]
  const confirmationStatuses = [
    "En attente",
    "Confirmé",
    "Annulé",
    "Reporté",
    "Double",
    "Ne répond pas 1",
    "Ne répond pas 2",
    "Ne répond pas 3",
  ]
  const sources = useMemo(() => Array.from(new Set(ordersWait.map((order) => order.source))), [ordersWait])
  const confirmatrices = workers.filter((w) => w.role === "Confirmatrice").map((c) => c.name)
console.log("wait",ordersWait);

  // Extraire tous les articles uniques de toutes les commandes
  const articles = useMemo(() => {
    const allArticles = new Set<string>()
    ordersWait.forEach((order) => {
      order.articles?.forEach((article: { product_name: string }) => {
        allArticles.add(article.name)
      })
    })
    return Array.from(allArticles)
  }, [ordersWait])

  // Filtrer les commandes en fonction des critères - mémorisé pour éviter des recalculs
  const filteredOrders = useMemo(() => {
    const filtered = ordersWait.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.wilaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.commune.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesWilaya = wilayaFilter === "all" || order.wilaya === wilayaFilter
      const matchesCommune = communeFilter === "all" || order.commune === communeFilter
      const matchesDeliveryCompany = deliveryCompanyFilter === "all" || order.deliveryCompany === deliveryCompanyFilter
      const matchesDeliveryCenter = deliveryCenterFilter === "all" || order.deliveryCenter === deliveryCenterFilter
      const matchesDeliveryType = deliveryTypeFilter === "all" || order.deliveryType === deliveryTypeFilter
      const matchesStatus = statusFilter === "all" || order.confirmationStatus === statusFilter
      const matchesSource = sourceFilter === "all" || order.source === sourceFilter
      const matchesConfirmatrice = confirmatriceFilter === "all" || order.confirmatrice === confirmatriceFilter
      const matchesArticle = articleFilter === "all" || order.articles.includes(articleFilter)

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
        matchesCommune &&
        matchesDeliveryCompany &&
        matchesDeliveryCenter &&
        matchesDeliveryType &&
        matchesStatus &&
        matchesSource &&
        matchesConfirmatrice &&
        matchesArticle &&
        matchesDateRange
      )
    })

    // Sort by numeric value of ID in descending order
    return filtered.sort((a, b) => {
      const getIdNumber = (id: string) => Number.parseInt(id.replace(/\D/g, ""), 10)
      return getIdNumber(b.id) - getIdNumber(a.id)
    })
  }, [
    ordersWait,
    searchTerm,
    wilayaFilter,
    communeFilter,
    deliveryCompanyFilter,
    deliveryCenterFilter,
    deliveryTypeFilter,
    statusFilter,
    sourceFilter,
    confirmatriceFilter,
    articleFilter,
    dateRange,
  ])

  // Gérer la sélection de toutes les lignes - mémorisé pour éviter des recréations de fonction
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

  // Gérer la sélection d'une ligne - mémorisé pour éviter des recréations de fonction
  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id])
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    }
  }, [])

  // Confirmer les commandes sélectionnées
  const confirmOrders = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à confirmer.",
        variant: "destructive",
      })
      return
    }

    selectedRows.forEach((id) => {
      updateOrder(id, { confirmationStatus: "Confirmé", status: "Confirmé" })
    })

    toast({
      title: "Commandes confirmées",
      description: `${selectedRows.length} commande(s) confirmée(s).`,
    })
    setSelectedRows([])
  }, [selectedRows, updateOrder])

  // Déplacer les commandes sélectionnées vers "En préparation" - mémorisé
  const moveToPreparation = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "En préparation")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "En préparation".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])

  // Ouvrir la modal d'édition - mémorisé
  const openEditModal = useCallback((order: Order) => {
    setEditingOrder(order)
    setIsEditModalOpen(true)
  }, [])

  // Ouvrir la modal de nouvelle commande - mémorisé
  const openNewOrderModal = useCallback(() => {
    setEditingOrder(undefined)
    setIsNewOrderModalOpen(true)
  }, [])

  // Ouvrir la modal de changement de confirmatrice
  const openConfirmatriceModal = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande.",
        variant: "destructive",
      })
      return
    }
    setIsConfirmatriceModalOpen(true)
  }, [selectedRows])

  // Changer la confirmatrice des commandes sélectionnées
  const changeConfirmatrice = useCallback(() => {
    if (!selectedConfirmatrice) {
      toast({
        title: "Aucune confirmatrice sélectionnée",
        description: "Veuillez sélectionner une confirmatrice.",
        variant: "destructive",
      })
      return
    }

    selectedRows.forEach((id) => {
      updateOrder(id, { confirmatrice: selectedConfirmatrice })
    })

    toast({
      title: "Confirmatrice mise à jour",
      description: `La confirmatrice a été changée pour ${selectedRows.length} commande(s).`,
    })

    setIsConfirmatriceModalOpen(false)
    setSelectedConfirmatrice("")
  }, [selectedRows, selectedConfirmatrice, updateOrder])

  // Supprimer une commande
  const deleteOrder = useCallback((id: string) => {
    // Dans un vrai système, nous ferions un appel API pour supprimer la commande
    // Ici, nous simulons simplement la suppression en affichant un toast
    toast({
      title: "Commande supprimée",
      description: `La commande ${id} a été supprimée.`,
    })
  }, [])

  // Réinitialiser les filtres - mémorisé
  const resetFilters = useCallback(() => {
    setWilayaFilter("all")
    setCommuneFilter("all")
    setDeliveryCompanyFilter("all")
    setDeliveryCenterFilter("all")
    setDeliveryTypeFilter("all")
    setStatusFilter("all")
    setSourceFilter("all")
    setConfirmatriceFilter("all")
    setArticleFilter("all")
    setDateRange(undefined)
  }, [])

  // Obtenir la couleur du badge pour le statut de confirmation - mémorisé
  const getConfirmationStatusColor = useCallback((status?: ConfirmationStatus) => {
    switch (status) {
      case "Confirmé":
        return "bg-green-950/50 text-green-400 border-green-700"
      case "En attente":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      case "Annulé":
        return "bg-red-950/50 text-red-400 border-red-700"
      case "Reporté":
        return "bg-blue-950/50 text-blue-400 border-blue-700"
      case "Double":
        return "bg-purple-950/50 text-purple-400 border-purple-700"
      case "Ne répond pas 1":
        return "bg-orange-950/50 text-orange-400 border-orange-700"
      case "Ne répond pas 2":
        return "bg-orange-950/50 text-orange-400 border-orange-700"
      case "Ne répond pas 3":
        return "bg-orange-950/50 text-orange-400 border-orange-700"
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

  // Gérer le déplacement d'une commande individuelle - mémorisé
  const handleConfirmOrder = useCallback(
    (orderId: string) => {
      updateOrder(orderId, { confirmationStatus: "Confirmé", status: "Confirmé" })
      toast({
        title: "Commande confirmée",
        description: `La commande a été confirmée.`,
      })
    },
    [updateOrder],
  )

  // Mettre à jour la société de livraison d'une commande
  const handleUpdateDeliveryCompany = useCallback(
    (orderId: string, companyId: string) => {
      updateOrder(orderId, { deliveryCompany: companyId })
      toast({
        title: "Société de livraison mise à jour",
        description: `La société de livraison a été mise à jour.`,
      })
    },
    [updateOrder],
  )

  // Mettre à jour le centre de livraison d'une commande
  const handleUpdateDeliveryCenter = useCallback(
    (orderId: string, centerId: string) => {
      updateOrder(orderId, { deliveryCenter: centerId })
      toast({
        title: "Centre de livraison mis à jour",
        description: `Le centre de livraison a été mis à jour.`,
      })
    },
    [updateOrder],
  )

  // Mettre à jour la wilaya d'une commande
  const handleUpdateWilaya = useCallback(
    (orderId: string, wilaya: string) => {
      updateOrder(orderId, { wilaya })
      toast({
        title: "Wilaya mise à jour",
        description: `La wilaya a été mise à jour.`,
      })
    },
    [updateOrder],
  )

  // Mettre à jour la commune d'une commande
  const handleUpdateCommune = useCallback(
    (orderId: string, commune: string) => {
      updateOrder(orderId, { commune })
      toast({
        title: "Commune mise à jour",
        description: `La commune a été mise à jour.`,
      })
    },
    [updateOrder],
  )

  // Mettre à jour le type de livraison d'une commande
  const handleUpdateDeliveryType = useCallback(
    (orderId: string, deliveryType: DeliveryType) => {
      updateOrder(orderId, { deliveryType })
      toast({
        title: "Type de livraison mis à jour",
        description: `Le type de livraison a été mis à jour.`,
      })
    },
    [updateOrder],
  )
  const changeConfirmatrices = (e) => {}
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

      {/* Modals */}
      <OrderEditModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} order={editingOrder} />
      <OrderEditModal open={isNewOrderModalOpen} onOpenChange={setIsNewOrderModalOpen} isNew={true} />

      {/* Modal pour changer la confirmatrice */}
      <Dialog open={isConfirmatriceModalOpen} onOpenChange={setIsConfirmatriceModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Changer la confirmatrice</DialogTitle>
            <DialogDescription>
              Sélectionnez une confirmatrice pour les {selectedRows.length} commande(s) sélectionnée(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedConfirmatrice}
              onValueChange={(e) => {
                setSelectedConfirmatrice(e)
                changeConfirmatrices(e)
              }}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700">
                <SelectValue placeholder="Sélectionner une confirmatrice" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {confirmatrices.map((confirmatrice) => (
                  <SelectItem key={confirmatrice} value={confirmatrice}>
                    {confirmatrice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmatriceModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={changeConfirmatrice}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barre d'outils */}
      <div className="flex justify-end mb-4">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={openNewOrderModal}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Nouvelle commande</span>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={confirmOrders}
                  disabled={selectedRows.length === 0}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Confirmer</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmer les commandes sélectionnées</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openConfirmatriceModal}
                  disabled={selectedRows.length === 0 || userRole!=="worker"}
                  className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  <span>Changer confirmatrice</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Changer la confirmatrice des commandes sélectionnées</p>
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
            <DropdownMenuContent className="bg-slate-900 border-slate-800">
              <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.id}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, id: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                ID
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.date}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, date: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.name}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, name: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Nom
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.phone}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, phone: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Téléphone
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.articles}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, articles: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Articles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.wilaya}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, wilaya: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Wilaya
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.commune}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, commune: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Commune
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryType}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, deliveryType: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Type de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryCompany}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, deliveryCompany: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Société de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryCenter}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, deliveryCenter: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Centre de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, status: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Statut
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.pickupPoint}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, pickupPoint: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Point de relais
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.deliveryPrice}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, deliveryPrice: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Prix de livraison
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.address}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, address: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Adresse
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.additionalInfo}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, additionalInfo: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Informations supplémentaires
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.confirmatrice}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, confirmatrice: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Confirmatrice
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.totalPrice}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, totalPrice: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Prix total
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.source}
                onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, source: checked })}
                className="hover:bg-slate-800 focus:bg-slate-800"
              >
                Source
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
            <SelectItem value="all">Wilaya</SelectItem>
            {wilayas.map((wilaya) => (
              <SelectItem key={wilaya.code} value={wilaya.name_ascii}>
                {wilaya.name_ascii} ({wilaya.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deliveryCompanyFilter} onValueChange={setDeliveryCompanyFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Société de livraison" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Société de livraison</SelectItem>
            {[...deliveryCompanies, { companyId: "deliveryMen" }].map((company) => (
              <SelectItem key={company.companyId} value={company.companyId}>
                {company.companyId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/*<Select value={deliveryCenterFilter || undefined} onValueChange={setDeliveryCenterFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Centre de livraison" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Centre de livraison</SelectItem>
            {deliveryCenterList?.map((center) => (
              <SelectItem key={center} value={center}>
                {center || "Non défini"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>*/}

        <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Type</SelectItem>
            {deliveryTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Statut</SelectItem>
            {confirmationStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Source</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={confirmatriceFilter} onValueChange={setConfirmatriceFilter}>
          <SelectTrigger className="h-8 w-[150px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Confirmatrice" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Confirmatrice</SelectItem>
            {confirmatrices.map((confirmatrice) => (
              <SelectItem key={confirmatrice} value={confirmatrice}>
                {confirmatrice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={articleFilter} onValueChange={setArticleFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Article" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Article</SelectItem>
            {articles.map((article) => (
              <SelectItem key={article} value={article}>
                {article}
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

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        <div>
          <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-max border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-slate-800">
                  <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400 w-[40px]">
                    <Checkbox
                      checked={selectedRows.length > 0 && selectedRows.length === filteredOrders.length}
                      onCheckedChange={handleSelectAll}
                      className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                    />
                  </th>
                  {visibleColumns.id && <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">ID</th>}
                  {visibleColumns.date && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Date</th>
                  )}
                  {visibleColumns.name && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Nom</th>
                  )}
                  {visibleColumns.phone && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Téléphone</th>
                  )}
                  {visibleColumns.articles && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Articles</th>
                  )}
                  {visibleColumns.wilaya && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Wilaya</th>
                  )}
                  {visibleColumns.commune && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Commune</th>
                  )}
                  {visibleColumns.deliveryType && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Type de livraison</th>
                  )}
                  {visibleColumns.deliveryCompany && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Société de livraison</th>
                  )}
                  {visibleColumns.deliveryCenter && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Centre de livraison</th>
                  )}
                  {visibleColumns.status && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Statut</th>
                  )}
                  {visibleColumns.pickupPoint && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Point de relais</th>
                  )}
                  {visibleColumns.deliveryPrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Prix livraison</th>
                  )}
                  {visibleColumns.address && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Adresse</th>
                  )}
                  {visibleColumns.additionalInfo && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Infos supp.</th>
                  )}
                  {visibleColumns.confirmatrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Confirmatrice</th>
                  )}
                  {visibleColumns.totalPrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Prix total</th>
                  )}
                  {visibleColumns.source && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Source</th>
                  )}
                  <th className="sticky top-0 bg-slate-900 p-3 text-right text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr className="border-b border-slate-800">
                    <td colSpan={19} className="text-center py-8 text-slate-400">
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
                        order.confirmationStatus?.startsWith("Ne répond pas") && "bg-orange-900/40",
  order.confirmationStatus === "Double" && "bg-gray-900/50",
  order.confirmationStatus === "Annulé" && "bg-red-900/40",
  order.confirmationStatus === "Reporté" && "bg-violet-900/40",
  order.confirmationStatus === "Confirmé" && "bg-green-900/40",
                      )}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedRows.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectRow(order.id, checked === true)}
                          className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                        />
                      </td>
                      {visibleColumns.id && <td className="p-3 font-medium text-slate-300">{order.docId}</td>}
                      {visibleColumns.date && <td className="p-3 text-slate-300">{order.date}</td>}
                      {visibleColumns.name && (
                        <td className="p-3 text-slate-300">
                          <HoverCard>
                            <HoverCardTrigger className="cursor-pointer hover:text-cyan-400 transition-colors block truncate">
                              {order.name}
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 bg-slate-900 border-slate-800 p-0">
                              <div className="p-3 border-b border-slate-800">
                                <h4 className="text-sm font-medium text-slate-200">Historique des statuts</h4>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto">
                                {order.statusHistory && order.statusHistory.length > 0 ? (
                                  <div className="p-0">
                                    {order.statusHistory.map((entry, index) => (
                                      <div
                                        key={index}
                                        className={cn(
                                          "p-3 flex justify-between items-center",
                                          index !== order.statusHistory!.length - 1 && "border-b border-slate-800",
                                        )}
                                      >
                                        <div>
                                          <Badge
                                            className={
                                              typeof entry.status === "string" &&
                                              confirmationStatuses.includes(entry.status as any)
                                                ? getConfirmationStatusColor(entry.status as ConfirmationStatus)
                                                : "bg-slate-950/50 text-slate-400 border-slate-700"
                                            }
                                            variant="outline"
                                          >
                                            {entry.status}
                                          </Badge>
                                          <p className="text-xs text-slate-400 mt-1">
                                            Par: {entry.changedBy || "Système"}
                                          </p>
                                        </div>
                                        <p className="text-xs text-slate-400">{entry.timestamp}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-3 text-center text-slate-400 text-sm">
                                    Aucun historique disponible
                                  </div>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </td>
                      )}
                      {visibleColumns.phone && <td className="p-3 text-slate-300">{order.phone}</td>}
                      {visibleColumns.articles && (
                        <td className="p-3 text-slate-300">
                          {order.articles.map((article: { product_name: string }) => article.product_name).join(", ")}
                        </td>
                      )}
                      {visibleColumns.wilaya && (
                        <td className="p-3 text-slate-300">
                          <Select
                            defaultValue={order.wilaya}
                            onValueChange={(value) => handleUpdateWilaya(order.id, value)}
                          >
                            <SelectTrigger className="h-8 w-full bg-slate-800/50 border-slate-700">
                              <SelectValue placeholder="Wilaya" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {wilayas.map((wilaya) => {
                                // Check if this wilaya matches the current value using normalized comparison

                                const isSelected = normalizeString(wilaya.wilaya_code) === normalizeString(order.wilaya)

                                return (
                                  <SelectItem
                                    key={wilaya.code}
                                    value={wilaya.wilaya_code}
                                    className={isSelected ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                  >
                                    {wilaya.name_ascii} ({wilaya.name}){isSelected && " ✓"}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleColumns.commune && (
                        <td className="p-3 text-slate-300">
                          <Select
                            defaultValue={order.commune}
                            onValueChange={(value) => handleUpdateCommune(order.id, value)}
                          >
                            <SelectTrigger className="h-8 w-full bg-slate-800/50 border-slate-700">
                              <SelectValue placeholder="Commune" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {getCommunesByWilayaName(order.wilaya)
                                .map((commune) => ({
                                  id: commune.id,
                                  namefr: commune.commune_name_ascii,
                                  namear: commune.commune_name,
                                  normalizedName: normalizeString(commune.commune_name_ascii),
                                }))
                                .sort((a, b) => a.namefr.localeCompare(b.namefr))
                                .map((commune) => {
                                  const isSelected = normalizeString(commune.namefr) === normalizeString(order.commune)
                                  const hasStopDesk = isStopDeskAvailable(commune.namefr)

                                  return (
                                    <SelectItem
                                      key={commune.id}
                                      value={commune.namefr}
                                      className={isSelected ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span>
                                          {commune.namefr} {commune.namear ? `(${commune.namear})` : ""}
                                          {isSelected && " ✓"}
                                        </span>
                                        {!hasStopDesk && order.deliveryType === "stopdesk" && (
                                          <span className="text-amber-500 text-xs font-medium ml-2 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded">
                                            no stopdesk
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleColumns.deliveryType && (
                        <td className="p-3 text-slate-300">
                          <Select
                            defaultValue={order.deliveryType}
                            onValueChange={(value) => handleUpdateDeliveryType(order.id, value as DeliveryType)}
                          >
                            <SelectTrigger
                              className={cn("h-8 w-full border", getDeliveryTypeColor(order.deliveryType))}
                            >
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {deliveryTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleColumns.deliveryCompany && (
                        <td className="p-3 text-slate-300">
                          <Select
                            defaultValue={order.deliveryCompany}
                            onValueChange={(value) => handleUpdateDeliveryCompany(order.id, value)}
                          >
                            <SelectTrigger className="h-8 w-full bg-slate-800/50 border-slate-700">
                              <SelectValue placeholder="Société de livraison" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {[...deliveryCompanies, { companyId: "deliveryMen" }].map((center) => (
                                <SelectItem key={center.companyId} value={center.companyId}>
                                  {center.companyId || "Non défini"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleColumns.deliveryCenter && (
                        <td className="p-3 text-slate-300">
                          <Select
                            defaultValue={order.deliveryCenter || ""}
                            onValueChange={(value) => handleUpdateDeliveryCenter(order.id, value)}
                          >
                            <SelectTrigger className="h-8 w-full bg-slate-800/50 border-slate-700">
                              <SelectValue placeholder="Centre de livraison" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {getYalidinCentersForCommune(order.commune)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((desk) => {
                                  // Use key for NOEST centers and center_id for Yalidin centers
                                  const centerId = desk.center_id
                                  return (
                                    <SelectItem key={centerId} value={centerId?.toString() || ""}>
                                      {desk.name}
                                    </SelectItem>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="p-3 text-slate-300">
                          <Select
                            value={order?.confirmationStatus}
                            onValueChange={(value) => {
                              updateConfirmationStatus(order.id, value as ConfirmationStatus)
                              // Show a toast to confirm the status change
                              toast({
                                title: "Statut mis à jour",
                                description: `Le statut a été changé en "${value}".`,
                              })
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 w-full border",
                                getConfirmationStatusColor(order.confirmationStatus as ConfirmationStatus),
                              )}
                            >
                              <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
                              {confirmationStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleColumns.pickupPoint && <td className="p-3 text-slate-300">{order.pickupPoint || "-"}</td>}
                      {visibleColumns.deliveryPrice && <td className="p-3 text-slate-300">{order.deliveryPrice}</td>}
                      {visibleColumns.address && (
                        <td className="p-3 text-slate-300 max-w-[200px] truncate">{order.address}</td>
                      )}
                      {visibleColumns.additionalInfo && (
                        <td className="p-3 text-slate-300">{order.additionalInfo || "-"}</td>
                      )}
                      {visibleColumns.confirmatrice && <td className="p-3 text-slate-300">{order.confirmatrice}</td>}

                      {visibleColumns.totalPrice && <td className="p-3 text-slate-300">{order.totalPrice}</td>}
                      {visibleColumns.source && <td className="p-3 text-slate-300">{order.source}</td>}
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
                            onClick={() => openEditModal(order)}
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleConfirmOrder(order.id)}
                            className="text-green-400 hover:text-green-300 hover:bg-slate-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Confirmer</span>
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
                              <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
                                <Package className="mr-2 h-4 w-4" />
                                <span>Détails</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="hover:bg-slate-800 focus:bg-slate-800">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Changer le statut</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:bg-slate-800 focus:bg-slate-800 text-red-400"
                                onClick={() => deleteOrder(order.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Supprimer</span>
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
