"use client"

import { useState } from "react"
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
import { useShop } from "@/context/shop-context"
import Link from "next/link"

// Add imports for the date range picker and other controls
import { DateRangePicker } from "@/components/date-range-picker"
import { Download, RefreshCw } from "lucide-react"
import type { DateRange } from "@/components/date-range-picker"

export function Topbar() {
  const { getStatusCounts, loading } = useShop()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const statusCounts = getStatusCounts()

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
      count: statusCounts["Confirmé"]|| 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-950/30",
      borderColor: "border-emerald-800/30",
      hoverColor: "hover:border-emerald-700",
    },
    {
      name: "En préparation",
      path: "/admin/commandes/en-preparation",
      count: statusCounts["En préparation"]|| 0,
      icon: Box,
      color: "text-blue-500",
      bgColor: "bg-blue-950/30",
      borderColor: "border-blue-800/30",
      hoverColor: "hover:border-blue-700",
    },
    {
      name: "Dispatcher",
      path: "/admin/commandes/dispatcher",
      count: statusCounts["Dispatcher"]|| 0,
      icon: ClipboardCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-950/30",
      borderColor: "border-purple-800/30",
      hoverColor: "hover:border-purple-700",
    },
    {
      name: "En livraison",
      path: "/admin/commandes/en-livraison",
      count: statusCounts["En livraison"]|| 0,
      icon: Truck,
      color: "text-orange-500",
      bgColor: "bg-orange-950/30",
      borderColor: "border-orange-800/30",
      hoverColor: "hover:border-orange-700",
    },
    {
      name: "Livrés",
      path: "/admin/commandes/livres",
      count: statusCounts["Livrés"]|| 0,
      icon: PackageCheck,
      color: "text-cyan-500",
      bgColor: "bg-cyan-950/30",
      borderColor: "border-cyan-800/30",
      hoverColor: "hover:border-cyan-700",
    },
    {
      name: "Retour",
      path: "/admin/commandes/retour",
      count: statusCounts["Retour"]|| 0,
      icon: PackageX,
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
          <div className="flex items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-8 bg-slate-800 border-slate-700 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
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
