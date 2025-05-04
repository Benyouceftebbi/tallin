"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock inventory data for the table
const inventoryItems = [
  {
    id: "INV-001",
    productName: "Wireless Earbuds Pro",
    sku: "WEP-001",
    variant: "Black / Medium",
    currentStock: {
      individual: 58,
      packs: 12,
    },
    startingStock: {
      individual: 60,
      packs: 12,
    },
    todaySales: {
      individual: 2,
      packs: 0,
    },
    incomingStock: {
      individual: 0,
      packs: 0,
      expected: "2023-07-15",
    },
    minStockLevel: 20,
    category: "Electronics",
    boutique: "Tech Haven",
    location: "Main Warehouse",
    lastUpdated: "2023-07-01 09:23:12",
  },
  {
    id: "INV-002",
    productName: "Wireless Earbuds Pro",
    sku: "WEP-001",
    variant: "Blue / Small",
    currentStock: {
      individual: 42,
      packs: 8,
    },
    startingStock: {
      individual: 45,
      packs: 8,
    },
    todaySales: {
      individual: 3,
      packs: 0,
    },
    incomingStock: {
      individual: 20,
      packs: 5,
      expected: "2023-07-10",
    },
    minStockLevel: 15,
    category: "Electronics",
    boutique: "Tech Haven",
    location: "Main Warehouse",
    lastUpdated: "2023-07-01 09:23:12",
  },
  {
    id: "INV-003",
    productName: "Premium Leather Wallet",
    sku: "PLW-002",
    variant: "Brown / Standard",
    currentStock: {
      individual: 98,
      packs: 19,
    },
    startingStock: {
      individual: 100,
      packs: 20,
    },
    todaySales: {
      individual: 2,
      packs: 1,
    },
    incomingStock: {
      individual: 0,
      packs: 0,
      expected: "",
    },
    minStockLevel: 30,
    category: "Accessories",
    boutique: "Leather Luxe",
    location: "Main Warehouse",
    lastUpdated: "2023-07-01 10:15:42",
  },
  {
    id: "INV-004",
    productName: "Smart Watch Series 5",
    sku: "SWS-003",
    variant: "Silver / One Size",
    currentStock: {
      individual: 22,
      packs: 4,
    },
    startingStock: {
      individual: 25,
      packs: 5,
    },
    todaySales: {
      individual: 3,
      packs: 1,
    },
    incomingStock: {
      individual: 15,
      packs: 3,
      expected: "2023-07-20",
    },
    minStockLevel: 20,
    category: "Electronics",
    boutique: "Tech Haven",
    location: "Main Warehouse",
    lastUpdated: "2023-07-01 11:08:33",
  },
  {
    id: "INV-005",
    productName: "Organic Cotton T-Shirt",
    sku: "OCT-004",
    variant: "White / Large",
    currentStock: {
      individual: 189,
      packs: 38,
    },
    startingStock: {
      individual: 190,
      packs: 38,
    },
    todaySales: {
      individual: 1,
      packs: 0,
    },
    incomingStock: {
      individual: 0,
      packs: 0,
      expected: "",
    },
    minStockLevel: 50,
    category: "Clothing",
    boutique: "Eco Apparel",
    location: "Secondary Warehouse",
    lastUpdated: "2023-07-01 12:42:18",
  },
  {
    id: "INV-006",
    productName: "Stainless Steel Water Bottle",
    sku: "SSWB-005",
    variant: "Blue / 20oz",
    currentStock: {
      individual: 122,
      packs: 24,
    },
    startingStock: {
      individual: 125,
      packs: 25,
    },
    todaySales: {
      individual: 3,
      packs: 1,
    },
    incomingStock: {
      individual: 50,
      packs: 10,
      expected: "2023-07-25",
    },
    minStockLevel: 40,
    category: "Home Goods",
    boutique: "Eco Living",
    location: "Main Warehouse",
    lastUpdated: "2023-07-01 14:15:33",
  },
]

type SortDirection = "asc" | "desc"
type SortField = "productName" | "currentStock" | "todaySales" | "lastUpdated"

export function InventoryTrackingTable() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })

  const [sortField, setSortField] = useState<SortField>("productName")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const [boutiqueFilter, setBoutiqueFilter] = useState<string>("All")
  const [showLowStock, setShowLowStock] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter and sort the inventory items
  const filteredItems = inventoryItems
    .filter((item) => {
      // Apply search query filter
      if (
        searchQuery &&
        !item.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.sku.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.variant.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Apply category filter
      if (categoryFilter !== "All" && item.category !== categoryFilter) {
        return false
      }

      // Apply boutique filter
      if (boutiqueFilter !== "All" && item.boutique !== boutiqueFilter) {
        return false
      }

      // Apply low stock filter
      if (showLowStock && item.currentStock.individual > item.minStockLevel) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortField === "productName") {
        return sortDirection === "asc"
          ? a.productName.localeCompare(b.productName)
          : b.productName.localeCompare(a.productName)
      } else if (sortField === "currentStock") {
        return sortDirection === "asc"
          ? a.currentStock.individual - b.currentStock.individual
          : b.currentStock.individual - a.currentStock.individual
      } else if (sortField === "todaySales") {
        return sortDirection === "asc"
          ? a.todaySales.individual - b.todaySales.individual
          : b.todaySales.individual - a.todaySales.individual
      } else if (sortField === "lastUpdated") {
        return sortDirection === "asc"
          ? a.lastUpdated.localeCompare(b.lastUpdated)
          : b.lastUpdated.localeCompare(a.lastUpdated)
      }
      return 0
    })

  // Get unique categories and boutiques for filters
  const categories = ["All", ...new Set(inventoryItems.map((item) => item.category))]
  const boutiques = ["All", ...new Set(inventoryItems.map((item) => item.boutique))]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
          <div className="relative w-full md:w-80">
            <Input
              placeholder="Search products..."
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
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
                {boutiques.map((boutique) => (
                  <SelectItem key={boutique} value={boutique}>
                    {boutique}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowstock"
              checked={showLowStock}
              onCheckedChange={(checked) => setShowLowStock(checked as boolean)}
            />
            <label
              htmlFor="lowstock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Low Stock Only
            </label>
          </div>

          <DatePickerWithRange date={date} setDate={setDate} />

          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>

          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
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
              <TableHead className="cursor-pointer" onClick={() => handleSort("productName")}>
                Product
                {sortField === "productName" && (
                  <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                )}
              </TableHead>
              <TableHead>SKU / Variant</TableHead>
              <TableHead>Category / Boutique</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("currentStock")}>
                Current Stock
                {sortField === "currentStock" && (
                  <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                )}
              </TableHead>
              <TableHead>Starting Stock</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("todaySales")}>
                Today's Sales
                {sortField === "todaySales" && (
                  <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                )}
              </TableHead>
              <TableHead>Incoming Stock</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("lastUpdated")}>
                Last Updated
                {sortField === "lastUpdated" && (
                  <span className="ml-2 inline-block">{sortDirection === "asc" ? "▴" : "▾"}</span>
                )}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{item.sku}</span>
                    <span className="text-xs text-muted-foreground">{item.variant}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{item.category}</span>
                    <span className="text-xs text-muted-foreground">{item.boutique}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span
                        className={item.currentStock.individual < item.minStockLevel ? "text-red-500 font-medium" : ""}
                      >
                        {item.currentStock.individual}
                      </span>
                      <span className="text-xs text-muted-foreground">individual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{item.currentStock.packs}</span>
                      <span className="text-xs text-muted-foreground">packs</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span>{item.startingStock.individual}</span>
                      <span className="text-xs text-muted-foreground">individual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{item.startingStock.packs}</span>
                      <span className="text-xs text-muted-foreground">packs</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        {item.todaySales.individual}
                      </Badge>
                      <span className="text-xs text-muted-foreground">individual</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        {item.todaySales.packs}
                      </Badge>
                      <span className="text-xs text-muted-foreground">packs</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {item.incomingStock.individual > 0 || item.incomingStock.packs > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {item.incomingStock.individual}
                          </Badge>
                          <span className="text-xs text-muted-foreground">individual</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            {item.incomingStock.packs}
                          </Badge>
                          <span className="text-xs text-muted-foreground">packs</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Expected: {item.incomingStock.expected}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No incoming stock</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{item.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Record stock in
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Record stock out
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        View history
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
