"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp, Calendar, DownloadIcon, Eye, Filter, MoreHorizontal, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isWithinInterval, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Types pour les mouvements de stock
type MovementType = "in" | "out"

type Movement = {
  id: string
  date: string
  time: string
  type: MovementType
  productName: string
  sku: string
  variant: string
  quantity: number
  packSize: number // Taille standard d'un pack pour ce produit
  reason: string
  reference: string
  user: string
  category: string
  boutique: string
  value: number
}

// Données de mouvements de stock
const movementsData: Movement[] = []

// Composant principal pour le tableau de suivi des mouvements
export function MovementTrackingTable() {
  // États pour les filtres et le tri
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(new Date().setDate(new Date().getDate() + 700)),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [boutiqueFilter, setBoutiqueFilter] = useState<string>("all")
  const [reasonFilter, setReasonFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Movement>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // Fonction pour gérer le tri
  const handleSort = (field: keyof Movement) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setCategoryFilter("all")
    setBoutiqueFilter("all")
    setReasonFilter("all")
    setColumnFilters({})
    setDate({
      from: new Date(new Date().setDate(new Date().getDate() - 7)),
      to: new Date(),
    })
  }

  // Obtenir les valeurs uniques pour les filtres déroulants
  const categories = useMemo(() => {
    const uniqueCategories = new Set(movementsData.map((item) => item.category))
    return ["all", ...Array.from(uniqueCategories)]
  }, [])

  const boutiques = useMemo(() => {
    const uniqueBoutiques = new Set(movementsData.map((item) => item.boutique))
    return ["all", ...Array.from(uniqueBoutiques)]
  }, [])

  const reasons = useMemo(() => {
    const uniqueReasons = new Set(movementsData.map((item) => item.reason))
    return ["all", ...Array.from(uniqueReasons)]
  }, [])

  // Filtrer et trier les données
  const filteredMovements = useMemo(() => {
    return movementsData
      .filter((movement) => {
        // Filtre de recherche global
        if (
          searchQuery &&
          !movement.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !movement.sku.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !movement.reference.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !movement.user.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false
        }

        // Filtre par type de mouvement
        if (typeFilter !== "all" && movement.type !== typeFilter) {
          return false
        }

        // Filtre par catégorie
        if (categoryFilter !== "all" && movement.category !== categoryFilter) {
          return false
        }

        // Filtre par boutique
        if (boutiqueFilter !== "all" && movement.boutique !== boutiqueFilter) {
          return false
        }

        // Filtre par raison
        if (reasonFilter !== "all" && movement.reason !== reasonFilter) {
          return false
        }

        // Filtre par date
        if (date?.from && date?.to) {
          const movementDate = parseISO(`${movement.date}T${movement.time}`)
          if (!isWithinInterval(movementDate, { start: date.from, end: date.to })) {
            return false
          }
        }

        // Filtres de colonnes spécifiques
        for (const [key, value] of Object.entries(columnFilters)) {
          if (
            value &&
            !String(movement[key as keyof Movement])
              .toLowerCase()
              .includes(value.toLowerCase())
          ) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // Tri par champ
        const aValue = a[sortField]
        const bValue = b[sortField]

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        return 0
      })
  }, [
    searchQuery,
    typeFilter,
    categoryFilter,
    boutiqueFilter,
    reasonFilter,
    date,
    columnFilters,
    sortField,
    sortDirection,
  ])

  // Composant pour le filtre de colonne
  const ColumnFilter = ({ column }: { column: keyof Movement }) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
            <Filter className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-2">
            <h4 className="font-medium">Filtrer par {column}</h4>
            <Input
              placeholder={`Filtrer...`}
              value={columnFilters[column] || ""}
              onChange={(e) => {
                const newFilters = { ...columnFilters }
                if (e.target.value) {
                  newFilters[column] = e.target.value
                } else {
                  delete newFilters[column]
                }
                setColumnFilters(newFilters)
              }}
              className="h-8"
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newFilters = { ...columnFilters }
                  delete newFilters[column]
                  setColumnFilters(newFilters)
                }}
              >
                Réinitialiser
              </Button>
              <Button size="sm" onClick={() => document.dispatchEvent(new Event("click"))}>
                Appliquer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
          <div className="relative w-full md:w-80">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex space-x-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="in">Entrées</SelectItem>
                <SelectItem value="out">Sorties</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories
                  .filter((c) => c !== "all")
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={boutiqueFilter} onValueChange={setBoutiqueFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Boutique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les boutiques</SelectItem>
                {boutiques
                  .filter((b) => b !== "all")
                  .map((boutique) => (
                    <SelectItem key={boutique} value={boutique}>
                      {boutique}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <DatePickerWithRange date={date} setDate={setDate} />

          <Button variant="outline" size="icon" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  Date & Heure
                  {sortField === "date" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                  <ColumnFilter column="date" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                <div className="flex items-center">
                  Type
                  {sortField === "type" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("productName")}>
                <div className="flex items-center">
                  Produit
                  {sortField === "productName" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                  <ColumnFilter column="productName" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("sku")}>
                <div className="flex items-center">
                  SKU / Variante
                  {sortField === "sku" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                  <ColumnFilter column="sku" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("quantity")}>
                <div className="flex items-center">
                  Quantité
                  {sortField === "quantity" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("value")}>
                <div className="flex items-center">
                  Valeur
                  {sortField === "value" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("reason")}>
                <div className="flex items-center">
                  Motif
                  {sortField === "reason" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                  <ColumnFilter column="reason" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("reference")}>
                <div className="flex items-center">
                  Référence
                  {sortField === "reference" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                  <ColumnFilter column="reference" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("user")}>
                <div className="flex items-center">
                  Utilisateur
                  {sortField === "user" && (
                    <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                  )}
                  <ColumnFilter column="user" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{format(parseISO(movement.date), "dd/MM/yyyy", { locale: fr })}</span>
                    <span className="text-xs text-muted-foreground">{movement.time}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {movement.type === "in" ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <ArrowDown className="mr-1 h-3 w-3" />
                      Entrée
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      <ArrowUp className="mr-1 h-3 w-3" />
                      Sortie
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{movement.productName}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{movement.sku}</span>
                    <span className="text-xs text-muted-foreground">{movement.variant}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{movement.quantity} unités</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.ceil(movement.quantity / 5)} pack{Math.ceil(movement.quantity / 5) > 1 ? "s" : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{movement.value.toFixed(2)} €</TableCell>
                <TableCell>{movement.reason}</TableCell>
                <TableCell>{movement.reference}</TableCell>
                <TableCell>{movement.user}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        Voir l'historique
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Annuler le mouvement</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredMovements.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Aucun mouvement trouvé pour les critères de recherche actuels.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
