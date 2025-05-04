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
const movementsData: Movement[] = [
  {
    id: "MOV-10001",
    date: "2025-07-01",
    time: "09:23:12",
    type: "out",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Noir / Moyen",
    quantity: 2,
    packSize: 5, // Ajout de la taille du pack
    reason: "Commande client",
    reference: "CMD-9381",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 259.98,
  },
  {
    id: "MOV-10002",
    date: "2025-07-01",
    time: "10:45:30",
    type: "out",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Bleu / Petit",
    quantity: 3,
    packSize: 5,
    reason: "Commande client",
    reference: "CMD-9382",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 389.97,
  },
  {
    id: "MOV-10003",
    date: "2025-07-01",
    time: "11:08:33",
    type: "out",
    productName: "Montre connectée Série 5",
    sku: "SWS-003",
    variant: "Argent / Taille unique",
    quantity: 3,
    packSize: 1,
    reason: "Commande client",
    reference: "CMD-9383",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 749.97,
  },
  {
    id: "MOV-10004",
    date: "2025-07-01",
    time: "12:42:18",
    type: "out",
    productName: "T-shirt en coton bio",
    sku: "OCT-004",
    variant: "Blanc / Large",
    quantity: 1,
    packSize: 10,
    reason: "Commande client",
    reference: "CMD-9384",
    user: "Système",
    category: "Vêtements",
    boutique: "Eco Apparel",
    value: 29.99,
  },
  {
    id: "MOV-10005",
    date: "2025-07-01",
    time: "14:15:33",
    type: "out",
    productName: "Bouteille d'eau en acier inoxydable",
    sku: "SSWB-005",
    variant: "Bleu / 20oz",
    quantity: 3,
    packSize: 12,
    reason: "Commande client",
    reference: "CMD-9385",
    user: "Système",
    category: "Articles ménagers",
    boutique: "Eco Living",
    value: 74.97,
  },
  {
    id: "MOV-10006",
    date: "2025-07-01",
    time: "15:30:41",
    type: "out",
    productName: "Portefeuille en cuir premium",
    sku: "PLW-002",
    variant: "Marron / Standard",
    quantity: 2,
    packSize: 8,
    reason: "Commande client",
    reference: "CMD-9386",
    user: "Système",
    category: "Accessoires",
    boutique: "Leather Luxe",
    value: 119.98,
  },
  {
    id: "MOV-10007",
    date: "2025-07-01",
    time: "16:45:22",
    type: "in",
    productName: "Haut-parleur Bluetooth",
    sku: "BS-006",
    variant: "Noir / Standard",
    quantity: 25,
    packSize: 6,
    reason: "Retour fournisseur",
    reference: "RF-2025-07-01",
    user: "Thomas Martin",
    category: "Électronique",
    boutique: "Sound Masters",
    value: 1999.75,
  },
  {
    id: "MOV-10008",
    date: "2025-07-01",
    time: "17:20:15",
    type: "out",
    productName: "Tapis de yoga",
    sku: "YM-007",
    variant: "Bleu / Standard",
    quantity: 5,
    packSize: 4,
    reason: "Commande client",
    reference: "CMD-9387",
    user: "Système",
    category: "Fitness",
    boutique: "Wellness World",
    value: 199.95,
  },
  {
    id: "MOV-10009",
    date: "2025-07-02",
    time: "08:30:10",
    type: "in",
    productName: "Lampe de bureau",
    sku: "DL-008",
    variant: "Argent / Standard",
    quantity: 30,
    packSize: 3,
    reason: "Bon de commande",
    reference: "BC-4836",
    user: "Sophie Dubois",
    category: "Articles ménagers",
    boutique: "Home Essentials",
    value: 1499.7,
  },
  {
    id: "MOV-10010",
    date: "2025-07-02",
    time: "09:15:45",
    type: "out",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Rouge / Moyen",
    quantity: 4,
    packSize: 5,
    reason: "Commande client",
    reference: "CMD-9388",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 519.96,
  },
  {
    id: "MOV-9995",
    date: "2025-06-30",
    time: "08:15:22",
    type: "in",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Noir / Moyen",
    quantity: 50,
    packSize: 5,
    reason: "Bon de commande",
    reference: "BC-4835",
    user: "Alex Johnson",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 3250.0,
  },
  {
    id: "MOV-9996",
    date: "2025-06-30",
    time: "09:30:45",
    type: "out",
    productName: "Portefeuille en cuir premium",
    sku: "PLW-002",
    variant: "Marron / Standard",
    quantity: 5,
    packSize: 8,
    reason: "Commande client",
    reference: "CMD-9374",
    user: "Système",
    category: "Accessoires",
    boutique: "Leather Luxe",
    value: 299.95,
  },
  {
    id: "MOV-9997",
    date: "2025-06-30",
    time: "11:20:18",
    type: "out",
    productName: "Montre connectée Série 5",
    sku: "SWS-003",
    variant: "Argent / Taille unique",
    quantity: 2,
    packSize: 1,
    reason: "Commande client",
    reference: "CMD-9375",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 499.98,
  },
  {
    id: "MOV-9998",
    date: "2025-06-30",
    time: "14:05:33",
    type: "out",
    productName: "Bouteille d'eau en acier inoxydable",
    sku: "SSWB-005",
    variant: "Bleu / 20oz",
    quantity: 4,
    packSize: 12,
    reason: "Commande client",
    reference: "CMD-9376",
    user: "Système",
    category: "Articles ménagers",
    boutique: "Eco Living",
    value: 99.96,
  },
  {
    id: "MOV-9994",
    date: "2025-06-29",
    time: "10:15:22",
    type: "in",
    productName: "T-shirt en coton bio",
    sku: "OCT-004",
    variant: "Blanc / Large",
    quantity: 100,
    packSize: 10,
    reason: "Bon de commande",
    reference: "BC-4834",
    user: "Marie Dupont",
    category: "Vêtements",
    boutique: "Eco Apparel",
    value: 1250.0,
  },
  {
    id: "MOV-9993",
    date: "2025-06-29",
    time: "13:45:30",
    type: "in",
    productName: "Portefeuille en cuir premium",
    sku: "PLW-002",
    variant: "Marron / Standard",
    quantity: 30,
    packSize: 8,
    reason: "Bon de commande",
    reference: "BC-4833",
    user: "Marie Dupont",
    category: "Accessoires",
    boutique: "Leather Luxe",
    value: 750.0,
  },
  {
    id: "MOV-9992",
    date: "2025-06-29",
    time: "15:30:25",
    type: "out",
    productName: "Haut-parleur Bluetooth",
    sku: "BS-006",
    variant: "Noir / Standard",
    quantity: 3,
    packSize: 6,
    reason: "Commande client",
    reference: "CMD-9373",
    user: "Système",
    category: "Électronique",
    boutique: "Sound Masters",
    value: 239.97,
  },
  {
    id: "MOV-9991",
    date: "2025-06-28",
    time: "09:10:15",
    type: "in",
    productName: "Montre connectée Série 5",
    sku: "SWS-003",
    variant: "Noir / Taille unique",
    quantity: 25,
    packSize: 1,
    reason: "Bon de commande",
    reference: "BC-4832",
    user: "Pierre Lefebvre",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 6249.75,
  },
  {
    id: "MOV-9990",
    date: "2025-06-28",
    time: "11:25:40",
    type: "out",
    productName: "Tapis de yoga",
    sku: "YM-007",
    variant: "Vert / Standard",
    quantity: 2,
    packSize: 4,
    reason: "Commande client",
    reference: "CMD-9372",
    user: "Système",
    category: "Fitness",
    boutique: "Wellness World",
    value: 79.98,
  },
  {
    id: "MOV-9989",
    date: "2025-06-28",
    time: "14:50:22",
    type: "out",
    productName: "Lampe de bureau",
    sku: "DL-008",
    variant: "Noir / Standard",
    quantity: 3,
    packSize: 3,
    reason: "Commande client",
    reference: "CMD-9371",
    user: "Système",
    category: "Articles ménagers",
    boutique: "Home Essentials",
    value: 149.97,
  },
  {
    id: "MOV-9988",
    date: "2025-06-27",
    time: "08:45:30",
    type: "in",
    productName: "Bouteille d'eau en acier inoxydable",
    sku: "SSWB-005",
    variant: "Rouge / 16oz",
    quantity: 40,
    packSize: 12,
    reason: "Bon de commande",
    reference: "BC-4831",
    user: "Julie Moreau",
    category: "Articles ménagers",
    boutique: "Eco Living",
    value: 999.6,
  },
  {
    id: "MOV-9987",
    date: "2025-06-27",
    time: "10:20:15",
    type: "out",
    productName: "T-shirt en coton bio",
    sku: "OCT-004",
    variant: "Noir / Medium",
    quantity: 5,
    packSize: 10,
    reason: "Commande client",
    reference: "CMD-9370",
    user: "Système",
    category: "Vêtements",
    boutique: "Eco Apparel",
    value: 149.95,
  },
  {
    id: "MOV-9986",
    date: "2025-06-27",
    time: "13:15:45",
    type: "in",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Blanc / Petit",
    quantity: 30,
    packSize: 5,
    reason: "Bon de commande",
    reference: "BC-4830",
    user: "Thomas Martin",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 1950.0,
  },
  {
    id: "MOV-9985",
    date: "2025-06-27",
    time: "15:40:22",
    type: "out",
    productName: "Portefeuille en cuir premium",
    sku: "PLW-002",
    variant: "Noir / Standard",
    quantity: 4,
    packSize: 8,
    reason: "Commande client",
    reference: "CMD-9369",
    user: "Système",
    category: "Accessoires",
    boutique: "Leather Luxe",
    value: 239.96,
  },
  {
    id: "MOV-9984",
    date: "2025-06-26",
    time: "09:30:10",
    type: "in",
    productName: "Haut-parleur Bluetooth",
    sku: "BS-006",
    variant: "Bleu / Standard",
    quantity: 20,
    packSize: 6,
    reason: "Bon de commande",
    reference: "BC-4829",
    user: "Sophie Dubois",
    category: "Électronique",
    boutique: "Sound Masters",
    value: 1599.8,
  },
  {
    id: "MOV-9983",
    date: "2025-06-26",
    time: "11:45:35",
    type: "out",
    productName: "Montre connectée Série 5",
    sku: "SWS-003",
    variant: "Argent / Taille unique",
    quantity: 2,
    packSize: 1,
    reason: "Commande client",
    reference: "CMD-9368",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 499.98,
  },
  {
    id: "MOV-9982",
    date: "2025-06-26",
    time: "14:20:50",
    type: "in",
    productName: "Tapis de yoga",
    sku: "YM-007",
    variant: "Bleu / Standard",
    quantity: 35,
    packSize: 4,
    reason: "Bon de commande",
    reference: "BC-4828",
    user: "Marie Dupont",
    category: "Fitness",
    boutique: "Wellness World",
    value: 1399.65,
  },
  {
    id: "MOV-9981",
    date: "2025-06-26",
    time: "16:10:25",
    type: "out",
    productName: "Lampe de bureau",
    sku: "DL-008",
    variant: "Argent / Standard",
    quantity: 3,
    packSize: 3,
    reason: "Commande client",
    reference: "CMD-9367",
    user: "Système",
    category: "Articles ménagers",
    boutique: "Home Essentials",
    value: 149.97,
  },
  {
    id: "MOV-9980",
    date: "2025-06-25",
    time: "08:55:15",
    type: "in",
    productName: "T-shirt en coton bio",
    sku: "OCT-004",
    variant: "Rouge / Large",
    quantity: 50,
    packSize: 10,
    reason: "Bon de commande",
    reference: "BC-4827",
    user: "Pierre Lefebvre",
    category: "Vêtements",
    boutique: "Eco Apparel",
    value: 1499.5,
  },
  {
    id: "MOV-9979",
    date: "2025-06-25",
    time: "10:40:30",
    type: "out",
    productName: "Bouteille d'eau en acier inoxydable",
    sku: "SSWB-005",
    variant: "Vert / 20oz",
    quantity: 4,
    packSize: 12,
    reason: "Commande client",
    reference: "CMD-9366",
    user: "Système",
    category: "Articles ménagers",
    boutique: "Eco Living",
    value: 99.96,
  },
  {
    id: "MOV-9978",
    date: "2025-06-25",
    time: "13:25:45",
    type: "in",
    productName: "Portefeuille en cuir premium",
    sku: "PLW-002",
    variant: "Marron / Standard",
    quantity: 25,
    packSize: 8,
    reason: "Bon de commande",
    reference: "BC-4826",
    user: "Julie Moreau",
    category: "Accessoires",
    boutique: "Leather Luxe",
    value: 1499.75,
  },
  {
    id: "MOV-9977",
    date: "2025-06-25",
    time: "15:50:20",
    type: "out",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Noir / Moyen",
    quantity: 3,
    packSize: 5,
    reason: "Commande client",
    reference: "CMD-9365",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 389.97,
  },
  {
    id: "MOV-9976",
    date: "2025-06-24",
    time: "09:15:40",
    type: "in",
    productName: "Haut-parleur Bluetooth",
    sku: "BS-006",
    variant: "Rouge / Standard",
    quantity: 15,
    packSize: 6,
    reason: "Bon de commande",
    reference: "BC-4825",
    user: "Thomas Martin",
    category: "Électronique",
    boutique: "Sound Masters",
    value: 1199.85,
  },
  {
    id: "MOV-9975",
    date: "2025-06-24",
    time: "11:30:55",
    type: "out",
    productName: "Tapis de yoga",
    sku: "YM-007",
    variant: "Vert / Standard",
    quantity: 3,
    packSize: 4,
    reason: "Commande client",
    reference: "CMD-9364",
    user: "Système",
    category: "Fitness",
    boutique: "Wellness World",
    value: 119.97,
  },
  {
    id: "MOV-9974",
    date: "2025-06-24",
    time: "14:05:10",
    type: "in",
    productName: "Montre connectée Série 5",
    sku: "SWS-003",
    variant: "Or / Taille unique",
    quantity: 20,
    packSize: 1,
    reason: "Bon de commande",
    reference: "BC-4824",
    user: "Sophie Dubois",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 4999.8,
  },
  {
    id: "MOV-9973",
    date: "2025-06-24",
    time: "16:25:35",
    type: "out",
    productName: "Lampe de bureau",
    sku: "DL-008",
    variant: "Noir / Standard",
    quantity: 2,
    packSize: 3,
    reason: "Commande client",
    reference: "CMD-9363",
    user: "Système",
    category: "Articles ménagers",
    boutique: "Home Essentials",
    value: 99.98,
  },
  {
    id: "MOV-9972",
    date: "2025-06-23",
    time: "08:40:25",
    type: "in",
    productName: "Bouteille d'eau en acier inoxydable",
    sku: "SSWB-005",
    variant: "Bleu / 16oz",
    quantity: 30,
    packSize: 12,
    reason: "Bon de commande",
    reference: "BC-4823",
    user: "Marie Dupont",
    category: "Articles ménagers",
    boutique: "Eco Living",
    value: 749.7,
  },
  {
    id: "MOV-9971",
    date: "2025-06-23",
    time: "10:55:50",
    type: "out",
    productName: "T-shirt en coton bio",
    sku: "OCT-004",
    variant: "Blanc / Medium",
    quantity: 4,
    packSize: 10,
    reason: "Commande client",
    reference: "CMD-9362",
    user: "Système",
    category: "Vêtements",
    boutique: "Eco Apparel",
    value: 119.96,
  },
  {
    id: "MOV-9970",
    date: "2025-06-23",
    time: "13:30:15",
    type: "in",
    productName: "Écouteurs sans fil Pro",
    sku: "WEP-001",
    variant: "Rouge / Petit",
    quantity: 25,
    packSize: 5,
    reason: "Bon de commande",
    reference: "BC-4822",
    user: "Pierre Lefebvre",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 1625.0,
  },
  {
    id: "MOV-9969",
    date: "2025-06-23",
    time: "15:45:40",
    type: "out",
    productName: "Portefeuille en cuir premium",
    sku: "PLW-002",
    variant: "Noir / Standard",
    quantity: 3,
    packSize: 8,
    reason: "Commande client",
    reference: "CMD-9361",
    user: "Système",
    category: "Accessoires",
    boutique: "Leather Luxe",
    value: 179.97,
  },
  {
    id: "MOV-9968",
    date: "2025-06-22",
    time: "09:20:30",
    type: "in",
    productName: "Tapis de yoga",
    sku: "YM-007",
    variant: "Rouge / Standard",
    quantity: 20,
    packSize: 4,
    reason: "Bon de commande",
    reference: "BC-4821",
    user: "Julie Moreau",
    category: "Fitness",
    boutique: "Wellness World",
    value: 799.8,
  },
  {
    id: "MOV-9967",
    date: "2025-06-22",
    time: "11:35:55",
    type: "out",
    productName: "Haut-parleur Bluetooth",
    sku: "BS-006",
    variant: "Noir / Standard",
    quantity: 2,
    packSize: 6,
    reason: "Commande client",
    reference: "CMD-9360",
    user: "Système",
    category: "Électronique",
    boutique: "Sound Masters",
    value: 159.98,
  },
  {
    id: "MOV-9966",
    date: "2025-06-22",
    time: "14:10:20",
    type: "in",
    productName: "Lampe de bureau",
    sku: "DL-008",
    variant: "Argent / Standard",
    quantity: 25,
    packSize: 3,
    reason: "Bon de commande",
    reference: "BC-4820",
    user: "Thomas Martin",
    category: "Articles ménagers",
    boutique: "Home Essentials",
    value: 1249.75,
  },
  {
    id: "MOV-9965",
    date: "2025-06-22",
    time: "16:30:45",
    type: "out",
    productName: "Montre connectée Série 5",
    sku: "SWS-003",
    variant: "Noir / Taille unique",
    quantity: 1,
    packSize: 1,
    reason: "Commande client",
    reference: "CMD-9359",
    user: "Système",
    category: "Électronique",
    boutique: "Tech Haven",
    value: 249.99,
  },
]

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
