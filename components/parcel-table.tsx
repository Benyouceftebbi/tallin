"use client"

import { useState } from "react"
import { CheckCircle, ChevronDown, MoreHorizontal, Package, Search } from "lucide-react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useShop, type OrderStatus } from "@/context/shop-context"

type ParcelTableProps = {
  status: string
}

export function ParcelTable({ status }: ParcelTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { getOrdersByStatus, loading } = useShop()

  // Obtenir les commandes en fonction du statut
  const getOrdersForTable = () => {
    if (status === "recent") {
      // Pour le tableau de bord, afficher un mélange de commandes récentes
      return getOrdersByStatus("all").slice(0, 10)
    } else {
      // Pour les autres pages, filtrer par statut
      const statusMap: Record<string, OrderStatus> = {
        confirmes: "Confirmés",
        "en-preparation": "En préparation",
        dispatcher: "Dispatcher",
        "en-livraison": "En livraison",
        livres: "Livrés",
        retour: "Retour",
      }

      const orderStatus = statusMap[status] as OrderStatus
      return orderStatus ? getOrdersByStatus(orderStatus) : []
    }
  }

  const orders = getOrdersForTable()

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.produit.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmés":
        return "bg-emerald-950/50 text-emerald-400 border-emerald-700"
      case "En préparation":
        return "bg-blue-950/50 text-blue-400 border-blue-700"
      case "Dispatcher":
        return "bg-purple-950/50 text-purple-400 border-purple-700"
      case "En livraison":
        return "bg-amber-950/50 text-amber-400 border-amber-700"
      case "Livrés":
        return "bg-cyan-950/50 text-cyan-400 border-cyan-700"
      case "Retour":
        return "bg-rose-950/50 text-rose-400 border-rose-700"
      default:
        return "bg-slate-950/50 text-slate-400 border-slate-700"
    }
  }

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
          <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800/50 text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead className="text-slate-400">ID</TableHead>
              <TableHead className="text-slate-400">Client</TableHead>
              <TableHead className="hidden md:table-cell text-slate-400">Produit</TableHead>
              <TableHead className="hidden md:table-cell text-slate-400">Date</TableHead>
              <TableHead className="hidden lg:table-cell text-slate-400">Prix</TableHead>
              {status === "recent" && <TableHead className="text-slate-400">Statut</TableHead>}
              <TableHead className="hidden lg:table-cell text-slate-400">Adresse</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow className="border-slate-800">
                <TableCell colSpan={status === "recent" ? 8 : 7} className="text-center py-8 text-slate-400">
                  Aucune commande trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-300">{order.id}</TableCell>
                  <TableCell className="text-slate-300">{order.client}</TableCell>
                  <TableCell className="hidden md:table-cell text-slate-300">{order.produit}</TableCell>
                  <TableCell className="hidden md:table-cell text-slate-300">{order.date}</TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-300">€{order.prix}</TableCell>
                  {status === "recent" && (
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)}`} variant="outline">
                        {order.status}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-slate-300">
                    {order.adresse}
                  </TableCell>
                  <TableCell className="text-right">
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
