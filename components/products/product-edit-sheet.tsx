"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Save, Trash, Search, Loader2, ChevronLeft, ChevronRight, Warehouse } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { useAppContext, type Product, type ProductOption, type ProductImage } from "@/context/app-context"
import { useDebounce } from "@/hooks/use-debounce"
import { type Depot, DepotsManagement } from "../invoices/depots-management"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { de } from "date-fns/locale"
import { generatePDF } from "./product"

type VariantCombination = {
  id: string
  option1: string | null
  option2: string | null
  option3: string | null
  price: string
  inventory_quantity: number
  sku: string
  image: string
  depots?: any
}

// Simplified product depot structure
type ProductDepot = {
  id: string
  name: string
  quantity: number
  priority: "principale" | "secondaire" | "tertiaire"
}

interface ProductEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
}

export function ProductEditSheet({ open, onOpenChange, productId }: ProductEditSheetProps) {
  const { products, setProducts } = useAppContext()
const existingProduct = useMemo(
  () => (productId ? products.find((p) => p.id === productId) : null),
  [productId, products],
)

// Initialize product state
const [product, setProduct] = useState<{
  id: string
  title: string
  body_html: string
  vendor: string
  product_type: string
  status: string
  tags: string
  depots?: ProductDepot[]
}>({
  id: "",
  title: "",
  body_html: "",
  vendor: "",
  product_type: "",
  status: "active",
  tags: "",
  depots: [],
})


// Initialize other states
const [canGoOutOfStock, setCanGoOutOfStock] = useState(true)
const [minimumAlertQuantity, setMinimumAlertQuantity] = useState(10)
const [generalVariantPrice, setGeneralVariantPrice] = useState("0.00")
const [hasMultipleDepots, setHasMultipleDepots] = useState(false)
const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
const [productDepots, setProductDepots] = useState<ProductDepot[]>([])
  // Initialize options state with data from product
  const [options, setOptions] = useState<ProductOption[]>(
    existingProduct?.options || [
      {
        id: `option-${Date.now()}-1`,
        name: "Couleur",
        position: 1,
        values: ["Default"],
      },
    ],
  )
// Refactored pure function
const convertToVariantCombinations = useCallback((product: typeof existingProduct) => {
  if (!product || !product.variants) return []

  return product.variants.map((variant) => {
    const variantImage = product.images.find((img) => img.variant_ids.includes(variant.id))
    return {
      id: variant.id,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3,
      price: variant.price,
      inventory_quantity: variant.inventory_quantity,
      sku: variant.sku,
      image: variantImage?.src || "/placeholder.svg",
      depots: variant.depots || [],
    }
  })
}, [])

// Update states when product is loaded
useEffect(() => {
  if (!existingProduct) return;

  // Prevent re-setting state if it's already set to this product
  if (existingProduct.id === product.id) return;

  console.log("Loading existing product:", existingProduct);

  setProduct({
    id: existingProduct.id,
    title: existingProduct.title,
    body_html: existingProduct.body_html,
    vendor: existingProduct.vendor,
    product_type: existingProduct.product_type,
    status: existingProduct.status || "active",
    tags: existingProduct.tags,
    depots: existingProduct.depots || [],
  });

  setCanGoOutOfStock(existingProduct.canGoOutOfStock ?? true);
  setMinimumAlertQuantity(existingProduct.minimumAlertQuantity ?? 10);
  setGeneralVariantPrice(existingProduct.variants?.[0]?.price ?? "0.00");
  setHasMultipleDepots((existingProduct.depots?.length || 0) > 1);
  setVariantCombinations(convertToVariantCombinations(existingProduct));
  setProductDepots(existingProduct.variants?.[0]?.depots || []);

  setOptions(
    existingProduct.options || {
      id: `option-${Date.now()}-1`,
      name: "Couleur",
      position: 1,
      values: ["Default"],
    }
  );
}, [existingProduct]);


// Variant filtering & pagination
const [variantSearchTerm, setVariantSearchTerm] = useState("")
const debouncedVariantSearch = useDebounce(variantSearchTerm, 300)
const [variantPage, setVariantPage] = useState(1)
const variantsPerPage = 50
const [optionFilters, setOptionFilters] = useState<Record<string, string>>({})
  const [isDepotsOpen, setIsDepotsOpen] = useState(false)


  // Loading state
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)





  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = useCallback((field: keyof typeof product, value: string) => {
    setProduct((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const addOption = useCallback(() => {
    const newPosition = options.length + 1
    setOptions([
      ...options,
      {
        id: `option-${Date.now()}`,
        name: "New Option",
        position: newPosition,
        values: ["Default"],
      },
    ])
  }, [options])

  const removeOption = useCallback(
    (id: string) => {
      if (options.length <= 1) {
        toast({
          title: "Cannot Remove",
          description: "Products must have at least one option.",
          variant: "destructive",
        })
        return
      }

      setOptions(options.filter((o) => o.id !== id))

      // Update variant combinations to remove this option
      setVariantCombinations(
        variantCombinations.map((combo) => {
          const optionPosition = options.find((o) => o.id === id)?.position
          if (optionPosition === 1) return { ...combo, option1: null }
          if (optionPosition === 2) return { ...combo, option2: null }
          if (optionPosition === 3) return { ...combo, option3: null }
          return combo
        }),
      )
    },
    [options, variantCombinations],
  )

  const updateOption = useCallback(
    (id: string, field: keyof ProductOption, value: string | string[] | number) => {
      setOptions(
        options.map((o) => {
          if (o.id === id) {
            return { ...o, [field]: value }
          }
          return o
        }),
      )
    },
    [options],
  )

  const updateOptionValues = useCallback(
    (id: string, values: string) => {
      setOptions(
        options.map((o) => {
          if (o.id === id) {
            return { ...o, values: values.split(",").map((v) => v.trim()) }
          }
          return o
        }),
      )
    },
    [options],
  )

  // Generate variants in batches to avoid UI freezing
  const generateCombinations = useCallback(async () => {
    setIsGeneratingVariants(true)

    try {
      // Sort options by position
      const sortedOptions = [...options].sort((a, b) => a.position - b.position)

      // Calculate total combinations to generate
      let totalCombinations = 1
      sortedOptions.forEach((option) => {
        totalCombinations *= option.values.filter((v) => v.trim() !== "").length
      })

      // Create a set of existing combinations for quick lookup
      const existingCombos = new Set(
        variantCombinations.map((combo) => JSON.stringify([combo.option1, combo.option2, combo.option3])),
      )

      // Generate combinations in batches
      const batchSize = 500
      let newCombinations: VariantCombination[] = []

      // Helper function to generate combinations recursively
      const generateCombinationsRecursive = (
        currentOptionIndex: number,
        currentCombination: { option1: string | null; option2: string | null; option3: string | null },
      ): VariantCombination[] => {
        if (currentOptionIndex === sortedOptions.length) {
          // We've processed all options, add this combination if it doesn't exist
          const comboKey = JSON.stringify([
            currentCombination.option1,
            currentCombination.option2,
            currentCombination.option3,
          ])

          if (!existingCombos.has(comboKey)) {
            return [
              {
                id: `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                option1: currentCombination.option1,
                option2: currentCombination.option2,
                option3: currentCombination.option3,
                price: "0.00",
                inventory_quantity: 0,
                sku: `${product.title.toLowerCase().replace(/\s+/g, "-")}-${currentCombination.option1?.toLowerCase() || ""}-${currentCombination.option2?.toLowerCase() || ""}`.replace(
                  /\s+/g,
                  "-",
                ),
                image: "/placeholder.svg",
              },
            ]
          }
          return []
        }

        const currentOption = sortedOptions[currentOptionIndex]
        let results: VariantCombination[] = []

        for (const value of currentOption.values) {
          if (value.trim() !== "") {
            const newCombination = { ...currentCombination }
            if (currentOption.position === 1) newCombination.option1 = value
            else if (currentOption.position === 2) newCombination.option2 = value
            else if (currentOption.position === 3) newCombination.option3 = value

            results = [...results, ...generateCombinationsRecursive(currentOptionIndex + 1, newCombination)]

            // If we've generated enough combinations for this batch, return early
            if (results.length >= batchSize) break
          }
        }

        return results
      }

      // Generate the first batch
      newCombinations = generateCombinationsRecursive(0, { option1: null, option2: null, option3: null })

      // Update state with the new combinations
      setVariantCombinations((prev) => [...prev, ...newCombinations])

      toast({
        title: "Combinations Generated",
        description: `Added ${newCombinations.length} new variant combinations.`,
      })
    } finally {
      setIsGeneratingVariants(false)
    }
  }, [options, variantCombinations, product.title])

  const addVariantCombination = useCallback(() => {
    // Create a new empty combination with default values
    const newCombination: VariantCombination = {
      id: `combo-${Date.now()}`,
      option1: options.find((o) => o.position === 1)?.values[0] || null,
      option2: options.find((o) => o.position === 2)?.values[0] || null,
      option3: options.find((o) => o.position === 3)?.values[0] || null,
      price: "0.00",
      inventory_quantity: 0,
      sku: "",
      image: "/placeholder.svg",
    }

    setVariantCombinations((prev) => [...prev, newCombination])
  }, [options])

  const removeVariantCombination = useCallback((id: string) => {
    setVariantCombinations((prev) => prev.filter((combo) => combo.id !== id))
  }, [])
  const updateVariantCombination = useCallback(
    (id: string, field: keyof VariantCombination | "depot_quantity", value: any) => {
      setVariantCombinations((prev) =>
        prev.map((combo) => {
          if (combo.id !== id) return combo

          if (field === "depot_quantity") {
            const updatedDepots = [...(combo.depots || [])]
            if (!updatedDepots[0]) {
              updatedDepots[0] = { id: "default", quantity: value } // fallback if depot missing
            } else {

              
              updatedDepots[0] = {
                ...updatedDepots[0],
                quantity: value,
              }
            }
            // Update the first depot's quantity

            
            return { ...combo,quantity: value, depots: updatedDepots,"depot_quantity": value }
          }

          return { ...combo, [field]: value }
        }),
      )
    },
    [],
  )

  const handleUploadImage = useCallback(
    (comboId: string) => {
      // Create a file input and trigger it
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string
            updateVariantCombination(comboId, "image", imageUrl)
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
    },
    [updateVariantCombination],
  )

  // Add this function after the existing callback functions
  const clearAllFilters = useCallback(() => {
    setVariantSearchTerm("")
    setOptionFilters({})
  }, [])

  // Replace the existing filteredVariants useMemo with this enhanced version
  const filteredVariants = useMemo(() => {
    let filtered = variantCombinations

    // Apply search filter
    if (debouncedVariantSearch) {
      const searchLower = debouncedVariantSearch.toLowerCase()
      filtered = filtered.filter(
        (variant) =>
          variant.option1?.toLowerCase().includes(searchLower) ||
          variant.option2?.toLowerCase().includes(searchLower) ||
          variant.option3?.toLowerCase().includes(searchLower) ||
          variant.sku.toLowerCase().includes(searchLower),
      )
    }

    // Apply option filters
    Object.entries(optionFilters).forEach(([optionId, filterValue]) => {
      if (filterValue && filterValue !== "all") {
        const option = options.find((o) => o.values.includes(filterValue))

        
        if (option) {
  
          filtered = filtered.filter((variant) => {
            if (option.position === 1) return variant.option1 === filterValue
            if (option.position === 2) return variant.option2 === filterValue
            if (option.position === 3) return variant.option3 === filterValue
            return true
          })
        }
      }
    })

    return filtered
  }, [variantCombinations, debouncedVariantSearch, optionFilters, options])

  // Paginate variants
  const paginatedVariants = useMemo(() => {
    const startIndex = (variantPage - 1) * variantsPerPage
    return filteredVariants.slice(startIndex, startIndex + variantsPerPage)
  }, [filteredVariants, variantPage, variantsPerPage])

  // Total pages for variants
  const totalVariantPages = Math.ceil(filteredVariants.length / variantsPerPage)

  // Reset to first page when search changes
  useEffect(() => {
    setVariantPage(1)
  }, [debouncedVariantSearch])

  // Depot management functions
  const handleAddDepot = useCallback(() => {
    setIsDepotsOpen(true)
  }, [])

  const handleSelectDepot = useCallback(
    (depot: Depot) => {
      // Check if depot is already added
      const existingDepotIndex = productDepots.findIndex((pd) => pd.id === depot.id)

      if (existingDepotIndex !== -1) {
        toast({
          title: "Dépôt déjà ajouté",
          description: `Le dépôt ${depot.name} est déjà associé à ce produit.`,
          variant: "destructive",
        })
        return
      }

      // Add new depot to product with simplified structure
      const newProductDepot: ProductDepot = {
        id: depot.id,
        name: depot.name,
        priority: depot.priority ||depot.type || "principale",
        quantity: 0,
      }

      setProductDepots([...productDepots, newProductDepot])

      toast({
        title: "Dépôt ajouté",
        description: `Le dépôt ${depot.name} a été ajouté au produit.`,
      })
    },
    [productDepots],
  )

  const handleRemoveDepot = useCallback(
    (depotId: string) => {
      setProductDepots(productDepots.filter((pd) => pd.id !== depotId))

      toast({
        title: "Dépôt retiré",
        description: "Le dépôt a été retiré du produit.",
      })
    },
    [productDepots],
  )

  const handleUpdateDepotPriority = useCallback(
    (index: number, priority: "principale" | "secondaire" | "tertiaire") => {
      setProductDepots((prevDepots) => {
        const updatedDepots = prevDepots.map((pd, i) => {
          if (i === index) {
            return { ...pd, priority }
          }
          return pd
        })

        // Sort depots so primary ones come first
        return updatedDepots.sort((a, b) => {
          const priorityOrder = { principale: 0, secondaire: 1, tertiaire: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
      })
    },
    [],
  )

  const handleUpdateDepotQuantity = useCallback(
    (index: number, quantity: number) => {
      setProductDepots(
        productDepots.map((pd, i) => {
          if (i === index) {
            return { ...pd, quantity }
          }
          return pd
        }),
      )
    },
    [productDepots],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Sort depots by priority before saving
      const sortedDepots = [...productDepots].sort((a, b) => {
        const priorityOrder = { principale: 0, secondaire: 1, tertiaire: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })


      // Update each variant's depots array with sorted depots
      const updatedVariantCombinations = variantCombinations.map((combo) => ({
        ...combo,
        depots: sortedDepots.map((depot) => ({
          id: depot.id,
          name: depot.name,
          priority: depot.priority || depot.type,
          quantity: combo?.depots?.[0]?.quantity || 0,
        })),
      }))

      // Create images for each variant
      const updatedImages: ProductImage[] = updatedVariantCombinations.map((combo, index) => {
        return {
          id: `img-${combo.id}`,
          src: combo.image,
          position: index + 1,
          alt: null,
          variant_ids: [combo.id],
        }
      })

      // Create updated product with new fields
      const updatedProduct: Product = {
        id: product.id || `product-${Date.now()}`,
        title: product.title,
        body_html: product.body_html,
        vendor: product.vendor,
        product_type: product.product_type,
        status: product.status,
        tags: product.tags,
        variants: updatedVariantCombinations,
        options: options,
        images: updatedImages,
        image: updatedImages[0],
        canGoOutOfStock,
        minimumAlertQuantity,
        hasMultipleDepots,
      }


      // Update Firebase for each variant with sorted depots
     if (productId) {
        for (const combo of updatedVariantCombinations) {

          
          const variantRef = doc(db, "Products", updatedProduct.id.toString(), "variants", combo.id.toString())

          const variantSnap = await getDoc(variantRef)
          if (!variantSnap.exists()) continue

          // Update variant with sorted depots (primary first)
          await updateDoc(variantRef, {
            depots: combo.depots,
          })
        }

        //setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)))
      } else {
        //setProducts([...products, updatedProduct])
      }


      toast({
        title: "Product Saved",
        description: `${product.title} has been saved successfully with updated depot configuration.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "There was an error saving the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-5xl overflow-y-auto" side="right">
          <form onSubmit={handleSubmit}>
            <SheetHeader className="pb-4">
              <SheetTitle>{productId ? "Edit Product" : "Add New Product"}</SheetTitle>
              <SheetDescription>
                {productId ? "Make changes to your product here." : "Add the details of your new product."}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Product Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter product title"
                        value={product.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input
                        id="vendor"
                        placeholder="Enter vendor name"
                        value={product.vendor}
                        onChange={(e) => handleInputChange("vendor", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body_html">Description</Label>
                    <Textarea
                      id="body_html"
                      placeholder="Enter product description"
                      className="min-h-[100px]"
                      value={product.body_html}
                      onChange={(e) => handleInputChange("body_html", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_type">Product Type</Label>
                      <Input
                        id="product_type"
                        placeholder="Enter product type"
                        value={product.product_type}
                        onChange={(e) => handleInputChange("product_type", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={product.status} onValueChange={(value) => handleInputChange("status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      placeholder="Enter tags"
                      value={product.tags}
                      onChange={(e) => handleInputChange("tags", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="canGoOutOfStock">Stock Management</Label>
                      <Select
                        value={canGoOutOfStock.toString()}
                        onValueChange={(value) => setCanGoOutOfStock(value === "true")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stock option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Can go out of stock</SelectItem>
                          <SelectItem value="false">Always in stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumAlert">Minimum Alert Quantity</Label>
                      <Input
                        id="minimumAlert"
                        type="number"
                        min="0"
                        placeholder="Enter minimum alert quantity"
                        value={minimumAlertQuantity}
                        onChange={(e) => setMinimumAlertQuantity(Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="generalPrice">General Variants Price (applies to all variants)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="generalPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={generalVariantPrice}
                        onChange={(e) => setGeneralVariantPrice(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (generalVariantPrice && Number.parseFloat(generalVariantPrice) > 0) {
                            setVariantCombinations((prev) =>
                              prev.map((combo) => ({ ...combo, price: generalVariantPrice })),
                            )
                            toast({
                              title: "Prices Updated",
                              description: `All variant prices set to ${generalVariantPrice}`,
                            })
                          }
                        }}
                      >
                        Apply to All Variants
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Depot Configuration</h3>
                  <div className="space-y-2">
                    <Label>Depot Setup</Label>
                    <Select
                      value={hasMultipleDepots.toString()}
                      onValueChange={(value) => setHasMultipleDepots(value === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select depot configuration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Single Depot</SelectItem>
                        <SelectItem value="true">Multiple Depots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                {/* Depot Management Section - Simplified */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Dépôts du Produit</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDepot}>
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Ajouter un Dépôt
                    </Button>
                  </div>

                  {productDepots.length === 0 ? (
                    <div className="text-center p-4 border rounded-md bg-muted">
                      <Warehouse className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucun dépôt associé à ce produit.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliquez sur "Ajouter un Dépôt" pour associer des dépôts à ce produit.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom du Dépôt</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Quantité</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productDepots?.map((depot, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{depot?.name}</TableCell>
                              <TableCell>
                                <Select
                                  value={depot?.priority}
                                  onValueChange={(value) =>
                                    handleUpdateDepotPriority(index, value as "principale" | "secondaire" | "tertiaire")
                                  }
                                >
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Priorité" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="principale">Principale</SelectItem>
                                    <SelectItem value="secondaire">Secondaire</SelectItem>
                                    <SelectItem value="tertiaire">Tertiaire</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                               <span className="w-20 inline-block text-center">
  {variantCombinations.reduce((total, variant) => {
    return total + (variant.depots?.[0]?.quantity || 0);
  }, 0)}
</span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDepot(depot.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Product Options</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      disabled={options.length >= 3}
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {options.map((option, index) => (
                    <div key={option.id} className="space-y-4">
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Option {index + 1}</h4>
                        {options.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => removeOption(option.id)}>
                            <Trash className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`option-name-${option.id}`}>Option Name</Label>
                          <Input
                            id={`option-name-${option.id}`}
                            placeholder="e.g., Color, Size"
                            value={option.name}
                            onChange={(e) => updateOption(option.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`option-values-${option.id}`}>Values (comma separated)</Label>
                          <Input
                            id={`option-values-${option.id}`}
                            placeholder="e.g., Red, Blue, Green"
                            value={option.values.join(", ")}
                            onChange={(e) => updateOptionValues(option.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCombinations}
                    className="w-full mt-2"
                    disabled={isGeneratingVariants}
                  >
                    {isGeneratingVariants ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>Generate All Variant Combinations</>
                    )}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Variant Combinations ({filteredVariants.length})</h3>

                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search variants..."
                        className="pl-8"
                        value={variantSearchTerm}
                        onChange={(e) => setVariantSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={addVariantCombination}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>
     <Button type="button" variant="outline" onClick={()=>generatePDF({name:product.title, variants:variantCombinations,option1:options[0].name,option2:options[1].name})} className="w-full mt-2">
                  
                      📄 Générer le PDF d'inventaire
                    </Button>
                  <Tabs defaultValue="table" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="table">Table View</TabsTrigger>
                      <TabsTrigger value="individual">Individual View</TabsTrigger>
                    </TabsList>
                    {/* Replace the TabsContent "table" section with this enhanced version that includes option filters: */}
                    <TabsContent value="table" className="space-y-4 pt-4">
                      {/* Option Filters */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Filter by Options</h4>
                          <Button type="button" variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
                            Clear All Filters
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {options.map((option) => (
                            <div key={option.id} className="space-y-1">
                              <Label className="text-xs text-muted-foreground">{option.name}</Label>
                              <Select
                                value={optionFilters[option.id] || "all"}
                                onValueChange={(value) =>
                                  setOptionFilters((prev) => ({
                                    ...prev,
                                    [option.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder={`All ${option.name}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All {option.name}</SelectItem>
                                  {option.values.map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {options.map((option) => (
                                <TableHead key={option.id}>{option.name}</TableHead>
                              ))}
                              <TableHead>Price</TableHead>
                              <TableHead>Inventory</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Image</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedVariants.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={options.length + 5} className="h-24 text-center">
                                  {Object.values(optionFilters).some((filter) => filter && filter !== "all") ||
                                  debouncedVariantSearch
                                    ? "No variants match the current filters."
                                    : "No variants found."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              paginatedVariants.map((combo) => (
                                <TableRow key={combo.id}>
                                  {options.map((option) => (
                                    <TableCell key={option.id}>
                                      <Select
                                        value={
                                          option.position === 1
                                            ? combo.option1 || ""
                                            : option.position === 2
                                              ? combo.option2 || ""
                                              : combo.option3 || ""
                                        }
                                        onValueChange={(value) => {
                                          if (option.position === 1)
                                            updateVariantCombination(combo.id, "option1", value)
                                          else if (option.position === 2)
                                            updateVariantCombination(combo.id, "option2", value)
                                          else if (option.position === 3)
                                            updateVariantCombination(combo.id, "option3", value)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder={`Select ${option.name}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {option.values.map((value) => (
                                            <SelectItem key={value} value={value}>
                                              {value}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  ))}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={Number.parseFloat(combo.price)}
                                      onChange={(e) => updateVariantCombination(combo.id, "price", e.target.value)}
                                      className="w-20"
                                      step="0.01"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={combo?.depots?.[0]?.quantity ?? 0}
                                      onChange={(e) =>
                                        updateVariantCombination(
                                          combo.id,
                                          "depot_quantity",
                                          Number.parseInt(e.target.value),
                                        )
                                      }
                                      className="w-16"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="text"
                                      value={combo.sku}
                                      onChange={(e) => updateVariantCombination(combo.id, "sku", e.target.value)}
                                      className="w-24"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                        <img
                                          src={combo.image || "/placeholder.svg"}
                                          alt="Variant"
                                          className="h-8 w-8 object-cover rounded"
                                        />
                                      </div>
                                      <Button variant="outline" size="sm" onClick={() => handleUploadImage(combo.id)}>
                                        Upload
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeVariantCombination(combo.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Variant pagination */}
                      {totalVariantPages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Page {variantPage} of {totalVariantPages} ({filteredVariants.length} variants)
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVariantPage((prev) => Math.max(prev - 1, 1))}
                              disabled={variantPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVariantPage((prev) => Math.min(prev + 1, totalVariantPages))}
                              disabled={variantPage === totalVariantPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button type="button" variant="outline" className="w-full" onClick={addVariantCombination}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Variant Combination
                      </Button>
                    </TabsContent>
                    <TabsContent value="individual" className="space-y-4 pt-4">
                      {paginatedVariants.map((combo, index) => (
                        <div key={combo.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Variant {index + 1}</h4>
                            <Button variant="ghost" size="sm" onClick={() => removeVariantCombination(combo.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {options.map((option) => (
                              <div key={option.id} className="space-y-2">
                                <Label>{option.name}</Label>
                                <Select
                                  value={
                                    option.position === 1
                                      ? combo.option1 || ""
                                      : option.position === 2
                                        ? combo.option2 || ""
                                        : combo.option3 || ""
                                  }
                                  onValueChange={(value) => {
                                    if (option.position === 1) updateVariantCombination(combo.id, "option1", value)
                                    else if (option.position === 2) updateVariantCombination(combo.id, "option2", value)
                                    else if (option.position === 3) updateVariantCombination(combo.id, "option3", value)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Select ${option.name}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {option.values.map((value) => (
                                      <SelectItem key={value} value={value}>
                                        {value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}

                            <div className="space-y-2">
                              <Label>Price</Label>
                              <Input
                                type="number"
                                value={Number.parseFloat(combo.price)}
                                onChange={(e) => updateVariantCombination(combo.id, "price", e.target.value)}
                                step="0.01"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Inventory Quantity</Label>
                              <Input
                                type="number"
                                value={combo?.depots?.[0]?.quantity ?? 0}
                                onChange={(e) =>
                                  updateVariantCombination(combo.id, "depot_quantity", Number.parseInt(e.target.value))
                                }
                                className="w-16"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>SKU</Label>
                              <Input
                                type="text"
                                value={combo.sku}
                                onChange={(e) => updateVariantCombination(combo.id, "sku", e.target.value)}
                              />
                            </div>

                            <div className="space-y-2 col-span-2">
                              <Label>Image</Label>
                              <div className="flex items-center space-x-4">
                                <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center">
                                  <img
                                    src={combo.image || "/placeholder.svg"}
                                    alt="Variant"
                                    className="h-16 w-16 object-cover rounded"
                                  />
                                </div>
                                <Button variant="outline" onClick={() => handleUploadImage(combo.id)}>
                                  Upload Image
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Variant pagination for individual view */}
                      {totalVariantPages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Page {variantPage} of {totalVariantPages}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVariantPage((prev) => Math.max(prev - 1, 1))}
                              disabled={variantPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVariantPage((prev) => Math.min(prev + 1, totalVariantPages))}
                              disabled={variantPage === totalVariantPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button type="button" variant="outline" className="w-full" onClick={addVariantCombination}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Variant Combination
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Product
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Depot Selection Sheet */}
      <DepotsManagement
        open={isDepotsOpen}
        onOpenChange={setIsDepotsOpen}
        onSelectDepot={handleSelectDepot}
        selectable={true}
      />
    </>
  )
}
