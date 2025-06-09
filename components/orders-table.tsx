"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, Edit } from "lucide-react"
import { useShop } from "@/context/shop-context"

const statusConfig = {
  en_attente: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400" },
  confirme: { label: "Confirmé", color: "bg-green-500/20 text-green-400" },
  en_livraison: { label: "En livraison", color: "bg-blue-500/20 text-blue-400" },
  livre: { label: "Livré", color: "bg-emerald-500/20 text-emerald-400" },
  retour: { label: "Retour", color: "bg-red-500/20 text-red-400" },
}

export function OrdersTable() {
  const { orders, loading } = useShop()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredOrders = useMemo(() => {
    if (!orders) return []

    return orders.filter(
      (order) =>
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.confirmatrice.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [orders, searchTerm])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="rounded-md border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 bg-slate-800/50">
                <TableHead className="text-slate-300">Commande</TableHead>
                <TableHead className="text-slate-300">Client</TableHead>
                <TableHead className="text-slate-300">Article</TableHead>
                <TableHead className="text-slate-300">Confirmatrice</TableHead>
                <TableHead className="text-slate-300">Statut</TableHead>
                <TableHead className="text-slate-300">Date</TableHead>
                <TableHead className="text-slate-300">Montant</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-slate-800">
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Rechercher par client, commande, article ou confirmatrice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 bg-slate-800/50">
              <TableHead className="text-slate-300">Commande</TableHead>
              <TableHead className="text-slate-300">Client</TableHead>
              <TableHead className="text-slate-300">Article</TableHead>
              <TableHead className="text-slate-300">Confirmatrice</TableHead>
              <TableHead className="text-slate-300">Statut</TableHead>
              <TableHead className="text-slate-300">Date</TableHead>
              <TableHead className="text-slate-300">Montant</TableHead>
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="border-slate-800 hover:bg-slate-800/30">
                <TableCell className="font-medium text-slate-100">{order.id}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-slate-100">{order.client}</p>
                    <p className="text-xs text-slate-400">{order.phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-100">{order.article}</TableCell>
                <TableCell className="text-slate-100">{order.confirmatrice}</TableCell>
                <TableCell>
                  <Badge className={statusConfig[order.status].color}>{statusConfig[order.status].label}</Badge>
                </TableCell>
                <TableCell className="text-slate-100">{order.date}</TableCell>
                <TableCell className="text-slate-100 font-medium">{order.amount.toLocaleString()} DH</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-8 text-slate-400">
          {searchTerm ? `Aucune commande trouvée pour "${searchTerm}"` : "Aucune commande disponible"}
        </div>
      )}
    </div>
  )
}
