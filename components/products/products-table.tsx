"use client"

import React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Edit, MoreHorizontal, ChevronLeft, ChevronRight, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductEditSheet } from "@/components/products/product-edit-sheet"
import { useAppContext } from "@/context/app-context"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useDebounce } from "@/hooks/use-debounce"

// Define a type for the transformed product data
type TransformedProduct = {
  id: string
  name: string
  sku: string
  status: string
  category: string
  price: number
  buyPrice: number
  stock: number
  image: string
  boutique: string
  variants: number
}

export function ProductsTable({ filterStatus }: { filterStatus?: "active" | "draft" | "archived" }) {
  const { products } = useAppContext()
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all")

  // Reference for virtualized list
  const parentRef = React.useRef<HTMLDivElement>(null)

  const handleSort = useCallback(
    (column: string) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortColumn(column)
        setSortDirection("asc")
      }
    },
    [sortColumn, sortDirection],
  )

  const handleEditProduct = useCallback((productId: string) => {
    setEditingProductId(productId)
    setIsEditSheetOpen(true)
  }, [])

  // Transform products from context to the format needed for the table - memoized for performance
  const transformedProducts = useMemo(() => {
    console.time("Transform products")
    const transformed = products?.map((product) => {
      // Calculate total stock across all variants
      const totalStock = product.variants.reduce((sum, variant) => sum + variant.inventory_quantity, 0)

      // Get the average price (or you could use the first variant's price)
      const averagePrice =
        product.variants.length > 0
          ? product.variants.reduce((sum, variant) => sum + Number.parseFloat(variant.price), 0) /
            product.variants.length
          : 0

      // Get the SKU prefix (common part of all variant SKUs)
      const skuPrefix = product.variants.length > 0 && product.variants[0].sku ? product.variants[0].sku.split(" ")[0] : ""

      return {
        id: product.id,
        name: product.title,
        sku: skuPrefix,
        status: product.status,
        category: product.product_type,
        price: averagePrice,
        buyPrice: averagePrice * 0.5, // Assuming cost is 50% of price for this example
        stock: totalStock,
        image: product.image?.src || "/placeholder.svg",
        boutique: product.vendor,
        variants: product.variants.length,
      }
    })
    console.timeEnd("Transform products")
    return transformed
  }, [products])

  // Apply filters - memoized for performance
  const filteredProducts = useMemo(() => {
    console.time("Filter products")
    let filtered = transformedProducts

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((product) => product.status === filterStatus)
    }

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) || product.sku.toLowerCase().includes(searchLower),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    console.timeEnd("Filter products")
    return filtered
  }, [transformedProducts, filterStatus, debouncedSearchTerm, categoryFilter])

  // Apply sorting - memoized for performance
  const sortedProducts = useMemo(() => {
    console.time("Sort products")
    if (!sortColumn) return filteredProducts

    const sorted = [...filteredProducts].sort((a, b) => {
      const aValue = a[sortColumn as keyof TransformedProduct]
      const bValue = b[sortColumn as keyof TransformedProduct]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    console.timeEnd("Sort products")
    return sorted
  }, [filteredProducts, sortColumn, sortDirection])

  // Get unique categories for the filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    transformedProducts?.forEach((product) => {
      if (product.category) uniqueCategories.add(product.category)
    })
    return Array.from(uniqueCategories)
  }, [transformedProducts])

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts?.length / pageSize)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProducts?.slice(start, start + pageSize)
  }, [sortedProducts, currentPage, pageSize])

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: paginatedProducts?.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // estimated row height
    overscan: 5,
  })

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, categoryFilter, filterStatus])

  return (
    <>
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Items per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
              <SelectItem value="250">250 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results summary */}
        <div className="text-sm text-muted-foreground">
          Showing {paginatedProducts?.length} of {filteredProducts?.length} products
          {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead className="min-w-[150px]">
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("name")}>
                    <span>Product</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("category")}>
                    <span>Category</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("price")}>
                    <span>Price</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("stock")}>
                    <span>Stock</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!paginatedProducts? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full border-4 border-muted-foreground/20 border-t-primary animate-spin"></div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">Loading product data</h3>
          <p className="text-sm text-muted-foreground">Please wait while we fetch your inventory data...</p>
        </div>
      </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedProducts?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/products/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={product.stock < 50 ? "text-red-500" : ""}>{product.stock}</span>
                      </TableCell>
                      <TableCell>{product.boutique}</TableCell>
                      <TableCell>{product.variants}</TableCell>
                      <TableCell>
                        {product.status === "active" && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 border-green-400/20"
                          >
                            Active
                          </Badge>
                        )}
                        {product.status === "draft" && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border-yellow-400/20"
                          >
                            Draft
                          </Badge>
                        )}
                        {product.status === "archived" && (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-400/20"
                          >
                            Archived
                          </Badge>
                        )}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit product
                            </DropdownMenuItem>
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete product</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ProductEditSheet
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
        productId={editingProductId || undefined}
      />
    </>
  )
}
