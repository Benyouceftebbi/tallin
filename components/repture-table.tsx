"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Search, Edit, ArrowRight, Plus, Filter, UserCheck, Columns, MessageCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useShop, type Order, type DeliveryType } from "@/context/shop-context"
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
import type { DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO } from "date-fns"
import { DateRangePicker } from "@/components/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card"

import { algeriaRegions, comuness, wilayass } from "@/app/admin/commandes/en-attente/data/algeria-regions"
import { httpsCallable } from "firebase/functions"
import { auth, functions } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useAuth } from "@/context/auth-context"
import { useOrderSearchParams } from "@/hooks/use-search-params"
import { generateRuptureReport } from "@/app/admin/commandes/repture/repturePdf"

export function ReptureTable() {
  const {
    getOrdersByStatus,
    updateMultipleOrdersStatus,
    updateOrder,
    loading,
    updateConfirmationStatus,
    setOrders,
    deliveryCompanies, // Assuming this comes from the shop context
    deliveryCenters,workers,orders,updateMultipleOrdersStatustoEnAttente // Assuming this comes from the shop context
  } = useShop()
    const { userRole,workerName } = useAuth()

  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [editingOrder, setEditingOrder] = useState<Order | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isConfirmatriceModalOpen, setIsConfirmatriceModalOpen] = useState(false)
  const [selectedConfirmatrice, setSelectedConfirmatrice] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
const searchFilters = useOrderSearchParams()
  // Filtres
  const [wilayaFilter, setWilayaFilter] = useState<string>("all")
  const [communeFilter, setCommuneFilter] = useState<string>("all")
  const [deliveryCompanyFilter, setDeliveryCompanyFilter] = useState<string>("all")
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [confirmatriceFilter, setConfirmatriceFilter] = useState<string>("all")
  const [articleFilter, setArticleFilter] = useState<string>("all")
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
    deliveryCompany: true,
    pickupPoint: false,
    deliveryPrice: true,
    address: false,
    additionalInfo: false,
    confirmatrice: true,
    totalPrice: true,
    source: true,
    status:true
  })

  // Obtenir les commandes confirmées - mémorisé pour éviter des appels inutiles
  const allOrders = useMemo(() => getOrdersByStatus("Repture"), [getOrdersByStatus])

  // Filtrer pour n'avoir que les commandes confirmées
  const ordersConfirme = useMemo(() => {
   if (workerName) {
     return orders.filter(order =>
      order.status === "Repture"&& order.confirmatrice === workerName
    );
  }
   else {
    return orders.filter((order) => order.status === "Repture")
   
  }
}, [orders, userRole, workerName]);
// console.log("co",ordersConfirme);
  // Obtenir les listes uniques pour les filtres - mémorisées pour éviter des recalculs
  const wilayas = useMemo(() => Array.from(new Set(ordersConfirme.map((order) => order.wilaya))), [ordersConfirme])
  const communes = useMemo(() => Array.from(new Set(ordersConfirme.map((order) => order.commune))), [ordersConfirme])
 
  const deliveryTypes = useMemo(() => Array.from(new Set(ordersConfirme.map((order) => order.deliveryType))), [ordersConfirme])
  const sources = useMemo(() => Array.from(new Set(ordersConfirme.map((order) => order.source))), [ordersConfirme])
    const confirmatrices = workers.filter(w=>w.role==='Confirmatrice').map(c=>c.name)

  // Extraire tous les articles uniques de toutes les commandes
  const articles = useMemo(() => {
    const allArticles = new Set<string>();
    orders.forEach((order) => {
      order.articles.forEach((article: { product_name: string }) => {
        allArticles.add(article.name);
      });
    });
    return Array.from(allArticles)
  }, [ordersConfirme])

  // Filtrer les commandes en fonction des critères - mémorisé pour éviter des recalculs
  const filteredOrders = useMemo(() => {
    return ordersConfirme.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.wilaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.commune.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesWilaya = wilayaFilter === "all" || order.wilaya === wilayaFilter
      const matchesCommune = communeFilter === "all" || order.commune === communeFilter
      const matchesDeliveryCompany = deliveryCompanyFilter === "all" || order.deliveryCompany === deliveryCompanyFilter
      const matchesDeliveryType = deliveryTypeFilter === "all" || order.deliveryType === deliveryTypeFilter
      const matchesSource = sourceFilter === "all" || order.source === sourceFilter
      const matchesConfirmatrice = confirmatriceFilter === "all" || order.confirmatrice === confirmatriceFilter
      const matchesArticle = articleFilter === "all" || order.articles.includes(articleFilter)

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
        matchesDeliveryCompany &&
        matchesDeliveryType &&
        matchesSource &&
        matchesConfirmatrice &&
        matchesArticle &&
        matchesDateRange
      )
    })
  }, [
    ordersConfirme,
    searchTerm,
    wilayaFilter,
    communeFilter,
    deliveryCompanyFilter,
    deliveryTypeFilter,
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



  // Ouvrir la modal d'édition - mémorisé
  const openEditModal = useCallback((order: Order) => {
    setEditingOrder(order)
    setIsEditModalOpen(true)
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



  const resetFilters = useCallback(() => {
    setWilayaFilter("all")
    setCommuneFilter("all")
    setDeliveryCompanyFilter("all")
    setDeliveryTypeFilter("all")
    setSourceFilter("all")
    setConfirmatriceFilter("all")
    setArticleFilter("all")
    setDateRange(undefined)
  }, [])


  const changeConfirmatrices = (e) => {}
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
  const moveBack = useCallback(() => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }
    if (selectedRows.length > 1) {
      toast({
        title: "Plus d une commande sélectionnée",
        description: "Veuillez sélectionner une seul commande à déplacer.",
        variant: "destructive",
      })
      return
    }
    updateMultipleOrdersStatus(selectedRows, "en-attente")
    //updateMultipleOrdersStatustoEnAttente(selectedRows,"a modifier")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "Confirmés".`,
    })
    setSelectedRows([])
  }, [selectedRows, updateMultipleOrdersStatus])
  return (
    <div className="space-y-4">
      <Toaster />



  <OrderEditModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} order={editingOrder}  />
      {/* Barre d'outils */}
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
        <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={moveBack}
                    disabled={selectedRows.length === 0 || selectedRows.length > 1}
                    className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    <span>En attente</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Déplacer les commandes sélectionnées vers "En attente"</p>
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
                  disabled={selectedRows.length === 0 || userRole === "worker"}
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
    <Button type="button" variant="outline" onClick={()=>generateRuptureReport(filteredOrders)} className=" ">
                  
                      📄 Générer le PDF 
                    </Button>
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
              {Object.entries(visibleColumns).map(([key, value]) => (
                <div key={key} className="flex items-center px-2 py-1.5">
                  <Checkbox
                    id={`column-${key}`}
                    checked={value}
                    onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [key]: checked === true }))}
                    className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                  <label htmlFor={`column-${key}`} className="text-sm text-slate-300 cursor-pointer">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                </div>
              ))}
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
            <SelectItem value="all">Commune</SelectItem>
            {communes.map((commune) => (
              <SelectItem key={commune} value={commune}>
                {commune}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deliveryCompanyFilter} onValueChange={setDeliveryCompanyFilter}>
          <SelectTrigger className="h-8 w-[180px] bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">Entreprise</SelectItem>
            {[...deliveryCompanies,{companyId:"deliveryMen"}].map((company,id) => (
              <SelectItem key={id} value={company.companyId}>
                {company.companyId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
            {articles.map((article,id) => (
              <SelectItem key={id} value={article}>
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

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse">
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
                  {visibleColumns.name && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Client</th>
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
                                    {visibleColumns.status && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Statut</th>
                  )}
                  {visibleColumns.pickupPoint && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Point de relais</th>
                  )}
                  {visibleColumns.deliveryPrice && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Frais de livraison</th>
                  )}
                  {visibleColumns.address && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Adresse</th>
                  )}
                  {visibleColumns.additionalInfo && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">
                      Informations supplémentaires
                    </th>
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
                    <td colSpan={19} className="text-center py-8 text-slate-500">
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
                        searchFilters.highlightOrder === order.id && "ring-2 ring-cyan-500 bg-cyan-900/20",

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

                      {visibleColumns.name && <td className="p-3 text-slate-300">{order.name}</td>}
                      {visibleColumns.phone && <td className="p-3 text-slate-300">{order.phone}</td>}
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
                      {visibleColumns.wilaya &&  <td className="p-3 text-slate-300">{order.wilaya}</td>}
                      {visibleColumns.commune &&  <td className="p-3 text-slate-300">{order.commune}</td>}
                      {visibleColumns.deliveryType &&  <td className="p-3 text-slate-300">{order.deliveryType}</td>}
                      {visibleColumns.deliveryCompany &&  <td className="p-3 text-slate-300">{order.deliveryCompany}</td>}
   {visibleColumns.deliveryCenter &&  <td className="p-3 text-slate-300">{order.deliveryCenter}</td>}
                      {visibleColumns.status && <td className="p-3 text-slate-300">{order.confirmationStatus}</td>}
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
