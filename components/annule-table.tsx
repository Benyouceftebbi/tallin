"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle, MoreHorizontal, Package, Search, ArrowRight, Clock, Columns, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useShop, type DeliveryType, type SmsStatus } from "@/context/shop-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { DateRange } from "@/components/date-range-picker"
import { isWithinInterval, parseISO } from "date-fns"
import { useOrderSearchParams } from "@/hooks/use-search-params"
import { HoverCardContent, HoverCardTrigger } from "./ui/hover-card"
import { HoverCard } from "@radix-ui/react-hover-card"
import { useAuth } from "@/context/auth-context"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
export function AnnuleTable() {
  const { getOrdersByStatus, updateMultipleOrdersStatus, sendSmsReminder, loading,updateMultipleOrdersStatustoEnAttente } = useShop()
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
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

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
        articles: true,
  })

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }))
  }
  const [trackingHistory, setTrackingHistory] = useState<any[]>([])
  const [orderTrackingNodes, setOrderTrackingNodes] = useState<Record<string, TrackingNode>>({})
  // Écouter les changements Firebase pour l'historique de suivi
  useEffect(() => {
    const unsubscribeHistory = onSnapshot(
      query(collection(db, "trackingHistory"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const historyData = []
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

  // Obtenir les commandes
  const orders = getOrdersByStatus("Annulé")
  const { workerName } = useAuth()
  // Filtrer les commandes en fonction du terme de recherche
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.toLowerCase().includes(searchTerm.toLowerCase())

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

    return matchesSearch && matchesDateRange
  })
  const ordersWithTracking = useMemo(() => {
    const baseOrders = getOrdersByStatus("Annulé");
  
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
  // Gérer la sélection de toutes les lignes
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredOrders.map((order) => order.id))
    } else {
      setSelectedRows([])
    }
  }

  // Gérer la sélection d'une ligne
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, id])
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    }
  }

  // Déplacer les commandes sélectionnées vers "En préparation"
  const moveToEnPreparation = () => {
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
  }

  // Déplacer les commandes sélectionnées vers "En livraison"
  const moveToEnLivraison = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "Aucune commande sélectionnée",
        description: "Veuillez sélectionner au moins une commande à déplacer.",
        variant: "destructive",
      })
      return
    }

    updateMultipleOrdersStatus(selectedRows, "en-attente")
    updateMultipleOrdersStatustoEnAttente(selectedRows, "En attente")
    toast({
      title: "Commandes déplacées",
      description: `${selectedRows.length} commande(s) déplacée(s) vers "En livraison".`,
    })
    setSelectedRows([])
  }

  // Envoyer un SMS de rappel
  const handleSendReminder = (id: string) => {
    sendSmsReminder(id)
    toast({
      title: "SMS envoyé",
      description: "Un SMS de rappel a été envoyé au client.",
    })
  }

  // Obtenir la couleur du badge pour le statut SMS
  const getSmsStatusColor = (status: SmsStatus) => {
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
  }

  // Obtenir la couleur du badge pour le type de livraison
  const getDeliveryTypeColor = (type: DeliveryType) => {
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
  }
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
    // Obtenir la couleur du badge pour le statut SMS - mémorisé
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
                  onClick={moveToEnLivraison}
                  disabled={selectedRows.length === 0}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  <span>En Attente</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer les commandes sélectionnées vers "En Attente"</p>
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
                onClick={() => toggleColumnVisibility("note")}
              >
                <Checkbox
                  checked={visibleColumns.note}
                  className="mr-2 bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                />
                <span>Note</span>
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

      <div className="flex flex-wrap gap-2 p-3 rounded-md border border-slate-800 bg-slate-900/50 mb-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-slate-400" />
          <span className="text-sm text-slate-400 mr-2">Filtres:</span>
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-900 shadow">
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="w-[40px] text-slate-400">
                  <Checkbox
                    checked={selectedRows.length > 0 && selectedRows.length === filteredOrders.length}
                    onCheckedChange={handleSelectAll}
                    className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                  />
                </TableHead>
                {visibleColumns.trackingId && <TableHead className="text-slate-400">TrackingID</TableHead>}
                {visibleColumns.recipient && <TableHead className="text-slate-400">Recipient</TableHead>}
                {visibleColumns.status && <TableHead className="text-slate-400">Status</TableHead>}
                                  {visibleColumns.articles && (
                    <th className="sticky top-0 bg-slate-900 p-3 text-left text-slate-400">Articles</th>
                  )}
                {visibleColumns.sms && <TableHead className="text-slate-400">SMS</TableHead>}
                {visibleColumns.type && <TableHead className="text-slate-400">Type</TableHead>}
                {visibleColumns.wilaya && <TableHead className="text-slate-400">Wilaya</TableHead>}
                {visibleColumns.commune && <TableHead className="text-slate-400">Commune</TableHead>}
                {visibleColumns.deliveryCompany && (
                  <TableHead className="text-slate-400">Société de livraison</TableHead>
                )}
                {visibleColumns.confirmatrice && <TableHead className="text-slate-400">Confirmatrice</TableHead>}
                {visibleColumns.preparateur && <TableHead className="text-slate-400">Préparateur</TableHead>}
                {visibleColumns.note && <TableHead className="text-slate-400">Note</TableHead>}
                {visibleColumns.lastUpdated && <TableHead className="text-slate-400">Last Updated</TableHead>}
                {visibleColumns.sendReminder && <TableHead className="text-slate-400">Send Reminder</TableHead>}
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={11} className="text-center py-8 text-slate-400">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "border-slate-800 hover:bg-slate-800/50",
                      selectedRows.includes(order.id) && "bg-slate-800/30",
                    searchFilters.highlightOrder === order.id && "ring-2 ring-cyan-500 bg-cyan-900/20", // <- This line
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(order.id)}
                        onCheckedChange={(checked) => handleSelectRow(order.id, checked === true)}
                        className="bg-slate-800/50 border-slate-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                    </TableCell>
                    {visibleColumns.trackingId && (
                      <TableCell className="font-medium text-slate-300">{order.trackingId}</TableCell>
                    )}
                      {visibleColumns.recipient && (
                         <td className="p-3 text-slate-300 group relative">
                          <div >
                            <span className="cursor-help">{order.name}</span>
                         
                                                      {order.confirmatrice && (
                            <div className="absolute z-50 invisible group-hover:visible bg-slate-900 border border-slate-800 rounded-md p-3 shadow-lg w-80 mt-1 left-0">
                              <h4 className="font-medium text-slate-300 mb-2">
                                Historique de suivi par {order.confirmatrice}
                              </h4>
                              {getTrackingHistoryForConfirmatrice(order.confirmatrice).filter(h => h.orderId === order.id).length > 0 ? (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {getTrackingHistoryForConfirmatrice(order.confirmatrice).filter(h => h.orderId === order.id).map((history) => (
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
                          </div>
                        </td>
                      )}
                    {visibleColumns.status && (
                      <TableCell className="text-slate-300">
                        <Badge className="bg-purple-950/50 text-purple-400 border-purple-700" variant="outline">
                          {order.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.articles && (
  <td className="p-3 text-slate-300">
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer hover:text-cyan-400 transition-colors block truncate">
        {order.articles.map((article: { product_name: string }) => article.product_name).join(", ")}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-slate-900 border-slate-800 p-0">
        <div className="p-3 border-b border-slate-800">
          <h4 className="text-sm font-medium text-slate-200">Détails des articles</h4>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <div className="p-3 space-y-2">
            {order.articles.map((article: any, index: number) => {
              const productTitle = `${article.product_name} ${article.variant_options?.option1 || ''} ${article.variant_options?.option2 || ''} (${article.quantity || ''})`.trim();
              return (
                <div
                  key={index}
                  className="p-2 bg-slate-800/50 rounded-md border border-slate-700"
                >
                  <div className="text-sm text-slate-200 font-medium">
                    {article.product_name}
                  </div>
                  {(article.variant_options?.option1 || article.variant_options?.option2) && (
                    <div className="text-xs text-slate-400 mt-1">
                      Variante: {[article.variant_options?.option1, article.variant_options?.option2].filter(Boolean).join(' / ')}
                    </div>
                  )}
                  {article.quantity && (
                    <div className="text-xs text-slate-400">
                      Quantité: {article.quantity}
                    </div>
                  )}
                  {article.price && (
                    <div className="text-xs text-slate-400">
                      Prix: {article.price}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  </td>
)}
                    {visibleColumns.sms && (
                      <TableCell className="text-slate-300">
                        <Badge className={getSmsStatusColor(order.smsStatus)} variant="outline">
                          {order.smsStatus}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.type && (
                      <TableCell className="text-slate-300">
                        <Badge className={getDeliveryTypeColor(order.deliveryType)} variant="outline">
                          {order.deliveryType}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.wilaya && <TableCell className="text-slate-300">{order.wilaya || "N/A"}</TableCell>}
                    {visibleColumns.commune && (
                      <TableCell className="text-slate-300">{order.commune || "N/A"}</TableCell>
                    )}
                    {visibleColumns.deliveryCompany && (
                      <TableCell className="text-slate-300">{order?.deliveryCompany}</TableCell>
                    )}
                    {visibleColumns.confirmatrice && (
                      <TableCell className="text-slate-300">{order.confirmatrice || "N/A"}</TableCell>
                    )}
                    {visibleColumns.preparateur && (
                      <TableCell className="text-slate-300">{order.confirmatrice || "N/A"}</TableCell>
                    )}
                    {visibleColumns.note && (
                      <TableCell className="text-slate-300">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {}}
                          className={cn("border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:text-slate-100")}
                        >
                          <span>Note</span>
                        </Button>
                      </TableCell>
                    )}
                    {visibleColumns.lastUpdated && (
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
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
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.sendReminder && (
                      <TableCell className="text-slate-300">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReminder(order.id)}
                          className="border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                        >
                          <span>SMS</span>
                        </Button>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            handleSelectRow(order.id, true)
                            updateMultipleOrdersStatus([order.id], "En livraison")
                            toast({
                              title: "Commande déplacée",
                              description: `La commande ${order.trackingId} a été déplacée vers "En livraison".`,
                            })
                          }}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                        >
                          <ArrowRight className="h-4 w-4" />
                          <span className="sr-only">Déplacer</span>
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
                              className="hover:bg-slate-800 focus:bg-slate-800"
                              onClick={() => {
                                handleSelectRow(order.id, true)
                                updateMultipleOrdersStatus([order.id], "En préparation")
                                toast({
                                  title: "Commande déplacée",
                                  description: `La commande ${order.trackingId} a été déplacée vers "En préparation".`,
                                })
                              }}
                            >
                              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                              <span>Retour vers En préparation</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
