"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle,
  Box,
  ClipboardCheck,
  Truck,
  PackageCheck,
  PackageX,
  Bell,
  Search,
  User,
  Clock,
  Download,
  RefreshCw,
  Ban,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

// Firebase imports
import { collection, where, getDocs, limit, getFirestore, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useShop } from "@/context/shop-context"
import { useRouter } from "next/navigation"


// Define the DateRange type
interface DateRange {
  from?: Date
  to?: Date
}

export function Topbar() {
  const { getStatusCounts, loading } = useShop()
 const statusCounts = getStatusCounts()
 const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // In the Topbar component, add the router hook after the existing state declarations:
  const router = useRouter()

  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setShowResults(false)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const ordersRef = collection(db, "orders")
        const searchTerm = searchQuery.toLowerCase()

        // Create multiple queries for different fields
        const queries = [
          // Search by name
          query(ordersRef, where("name", ">=", searchTerm), where("name", "<=", searchTerm + "\uf8ff"), limit(10)),
          // Search by phone
          query(ordersRef, where("phone", ">=", searchQuery), where("phone", "<=", searchQuery + "\uf8ff"), limit(10)),
          // Search by trackingId
          query(
            ordersRef,
            where("trackingId", ">=", searchQuery),
            where("trackingId", "<=", searchQuery + "\uf8ff"),
            limit(10),
          ),
        ]

        const results = new Map()

        for (const q of queries) {
          try {
            const snapshot = await getDocs(q)
            snapshot.docs.forEach((doc) => {
              const data = doc.data()
              // Additional client-side filtering for more flexible search
              const searchableText = `${data.name || ""} ${data.phone || ""} ${data.trackingId || ""}`.toLowerCase()
              if (searchableText.includes(searchTerm)) {
                results.set(doc.id, { id: doc.id, ...data,idd:doc.id })
              }
            })
          } catch (queryError) {
            console.warn("Query failed:", queryError)
          }
        }

        setSearchResults(Array.from(results.values()))
        setShowResults(true)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [],
  )

  // Debounce utility function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".relative")) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const statusLinks = [
    {
      name: "En attente",
      path: "/admin/commandes/en-attente",
      count: statusCounts["en-attente"] || 0,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-950/30",
      borderColor: "border-amber-800/30",
      hoverColor: "hover:border-amber-700",
    },
    {
      name: "Confirmés",
      path: "/admin/commandes/confirmes",
      count: statusCounts["Confirmé"] || 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-950/30",
      borderColor: "border-emerald-800/30",
      hoverColor: "hover:border-emerald-700",
    },
    {
      name: "En préparation",
      path: "/admin/commandes/en-preparation",
      count: statusCounts["En préparation"] || 0,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-950/30",
      borderColor: "border-blue-800/30",
      hoverColor: "hover:border-blue-700",
    },
    {
      name: "Dispatcher",
      path: "/admin/commandes/dispatcher",
      count: statusCounts["Dispatcher"] || 0,
      icon: ClipboardCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-950/30",
      borderColor: "border-purple-800/30",
      hoverColor: "hover:border-purple-700",
    },
    {
      name: "En livraison",
      path: "/admin/commandes/en-livraison",
      count: statusCounts["En livraison"] || 0,
      icon: Truck,
      color: "text-orange-500",
      bgColor: "bg-orange-950/30",
      borderColor: "border-orange-800/30",
      hoverColor: "hover:border-orange-700",
    },
    {
      name: "Livrés",
      path: "/admin/commandes/livres",
      count: statusCounts["Livrés"] || 0,
      icon: PackageCheck,
      color: "text-cyan-500",
      bgColor: "bg-cyan-950/30",
      borderColor: "border-cyan-800/30",
      hoverColor: "hover:border-cyan-700",
    },
    {
      name: "Retour",
      path: "/admin/commandes/retour",
      count: statusCounts["Retour"] || 0,
      icon: PackageX,
      color: "text-rose-500",
      bgColor: "bg-rose-950/30",
      borderColor: "border-rose-800/30",
      hoverColor: "hover:border-rose-700",
    },
    {
      name: "Annulé",
      path: "/admin/commandes/annule",
      count: statusCounts["Annulé"] || 0,
      icon: PackageX,
      color: "text-rose-500",
      bgColor: "bg-rose-950/30",
      borderColor: "border-rose-800/30",
      hoverColor: "hover:border-rose-700",
    },
        {
      name: "Reporté",
      path: "/admin/commandes/reporte",
      count: statusCounts["Reporté"] || 0,
      icon: Clock,
      color: "text-rose-500",
      bgColor: "bg-rose-950/30",
      borderColor: "border-rose-800/30",
      hoverColor: "hover:border-rose-700",
    },
            {
      name: "Repture",
      path: "/admin/commandes/repture",
      count: statusCounts["Repture"] || 0,
      icon:Ban,
      color: "text-rose-500",
      bgColor: "bg-rose-950/30",
      borderColor: "border-rose-800/30",
      hoverColor: "hover:border-rose-700",
    },
  ]

  return (
    <div className="border-b border-slate-800 bg-slate-900 p-4 shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher par nom, téléphone, ou ID de suivi..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 bg-slate-800 border-slate-700 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
            />

            {/* Search Results Dropdown */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-slate-400">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Recherche en cours...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="text-xs text-slate-400 px-2 py-1 border-b border-slate-700">
                      {searchResults.length} résultat(s) trouvé(s)
                    </div>
                    {searchResults.map((order) => (
                      <div
  key={order.id}
  className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
  onClick={() => {
    const statusRouteMap = {
      "en-attente": "/admin/commandes/en-attente",
      Confirmé: "/admin/commandes/confirmes",
      "En préparation": "/admin/commandes/en-preparation",
      Dispatcher: "/admin/commandes/dispatcher",
      "En livraison": "/admin/commandes/en-livraison",
      Livrés: "/admin/commandes/livres",
      Retour: "/admin/commandes/retour",
      "Reporté": "/admin/commandes/reporte",
       "Annulé": "/admin/commandes/annule",
         "Repture": "/admin/commandes/repture",
    }

    const targetRoute =
      statusRouteMap[order.status] ||
      statusRouteMap[order.confirmationStatus] ||
      "/admin/commandes/en-attente"

    const searchParams = new URLSearchParams({
      searchId: order.idd,
      searchName: order.name,
      searchPhone: order.phone,
      searchTrackingId: order.trackingId || "",
      highlightOrder: order.idd,
    })

    router.push(`${targetRoute}?${searchParams.toString()}`)

    setShowResults(false)
    setSearchQuery("")
  }}
>
  <div className="flex justify-between items-start gap-4">
    {/* Left side: Info split into two columns */}
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
      <div>
        <div className="font-medium text-slate-200">{order.name}</div>
        <div className="text-sm text-slate-400">{order.phone}</div>
        <div className="text-xs text-slate-500">ID: {order.trackingId}</div>
      </div>

      <div className="space-y-0.5">
        <div className="text-xs text-slate-200">
          Créé le:{" "}
          {order.createdAt?.toDate
            ? new Date(order.createdAt.toDate()).toLocaleString("fr-FR")
            : "Date inconnue"}
        </div>

        <div className="text-xs text-slate-200">
          Confirmatrice: {order.confirmatrice || "admin"}
        </div>

        <div className="text-xs text-slate-200">
          Articles:{" "}
          {Array.isArray(order.articles)
            ? order.articles.map((a) => a.product_name).join(", ")
            : "Aucun"}
        </div>
      </div>
    </div>

    {/* Right side: status + confirmationStatus */}
    <div className="flex flex-col items-end space-y-1">
      <div
        className={cn(
          "text-xs px-2 py-1 rounded-full w-fit",
          order.status === "Confirmé" && "bg-emerald-900 text-emerald-300",
          order.status === "En préparation" && "bg-blue-900 text-blue-300",
          order.status === "En livraison" && "bg-orange-900 text-orange-300",
          order.status === "Livrés" && "bg-cyan-900 text-cyan-300",
          order.status === "en-attente" && "bg-amber-900 text-amber-300",
          order.status === "Dispatcher" && "bg-purple-900 text-purple-300",
          order.status === "Retour" && "bg-rose-900 text-rose-300",
          order.status === "Reporté" && "bg-rose-900 text-rose-300",
          order.status === "Annulé" && "bg-red-900 text-red-300",
            order.status === "Repture" && "bg-red-900 text-red-300",
        )}
      >
        {order.status}
      </div>

      {order.status === "en-attente" && order.confirmationStatus && (
        <div className="text-xs text-slate-400 text-right">
          État de confirmation:{" "}
          <span className="font-semibold">{order.confirmationStatus}</span>
        </div>
      )}
    </div>
  </div>
</div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400">Aucun résultat trouvé</div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="date"
              className="bg-slate-800 border-slate-700 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              placeholder="Date"
            />
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <Button variant="outline" size="icon" className="border-slate-700 bg-slate-800 text-slate-400">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-slate-700 bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Paramètres</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem>Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Replace the scrollable flex container with a responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {statusLinks.map((status) => (
            <Link href={status.path} key={status.name} className="block">
              <Card
                className={cn(
                  "border transition-all duration-300 hover:shadow-md cursor-pointer",
                  status.borderColor,
                  status.hoverColor,
                  status.bgColor,
                  "border-slate-800 bg-slate-900/50",
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-full bg-slate-800 shadow-sm")}>
                      <status.icon className={cn("h-4 w-4", status.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-300">{status.name}</p>
                      <p className="text-lg font-bold text-slate-100">
                        {loading ? (
                          <span className="inline-block h-5 w-8 animate-pulse bg-slate-700 rounded"></span>
                        ) : (
                          status.count
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
