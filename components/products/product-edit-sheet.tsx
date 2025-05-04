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
import { PlusCircle, Save, Trash, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import {
  useAppContext,
  type Product,
  type ProductVariant,
  type ProductOption,
  type ProductImage,
} from "@/context/app-context"
import { useDebounce } from "@/hooks/use-debounce"

type VariantCombination = {
  id: string
  option1: string | null
  option2: string | null
  option3: string | null
  price: string
  inventory_quantity: number
  sku: string
  image: string
}

interface ProductEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: string
}

export function ProductEditSheet({ open, onOpenChange, productId }: ProductEditSheetProps) {
  const { products, setProducts } = useAppContext()

  // Find the product from the context if productId is provided
  const existingProduct = useMemo(
    () => (productId ? products.find((p) => p.id === productId) : null),
    [productId, products],
  )

  // Initialize product state with data from context or empty values
  const [product, setProduct] = useState<{
    id: string
    title: string
    body_html: string
    vendor: string
    product_type: string
    status: string
    tags: string
  }>({
    id: existingProduct?.id || "",
    title: existingProduct?.title || "",
    body_html: existingProduct?.body_html || "",
    vendor: existingProduct?.vendor || "",
    product_type: existingProduct?.product_type || "",
    status: existingProduct?.status || "active",
    tags: existingProduct?.tags || "",
  })

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

  // Convert product variants to variant combinations format
  const convertToVariantCombinations = useCallback(() => {
    if (!existingProduct || !existingProduct.variants) return []

    return existingProduct.variants.map((variant) => {
      // Find the image for this variant
      const variantImage = existingProduct.images.find((img) => img.variant_ids.includes(variant.id))

      return {
        id: variant.id,
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        price: variant.price,
        inventory_quantity: variant.inventory_quantity,
        sku: variant.sku,
        image: variantImage?.src || "/placeholder.svg",
      }
    })
  }, [existingProduct])

  // Initialize variant combinations with data from product
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>(
    existingProduct ? convertToVariantCombinations() : [],
  )

  // State for variant filtering and pagination
  const [variantSearchTerm, setVariantSearchTerm] = useState("")
  const debouncedVariantSearch = useDebounce(variantSearchTerm, 300)
  const [variantPage, setVariantPage] = useState(1)
  const variantsPerPage = 50

  // Loading state
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)

  // Update product state when productId changes
  useEffect(() => {
    if (productId) {
      const product = products.find((p) => p.id === productId)
      if (product) {
        setProduct({
          id: product.id,
          title: product.title,
          body_html: product.body_html,
          vendor: product.vendor,
          product_type: product.product_type,
          status: product.status,
          tags: product.tags,
        })
        setOptions(product.options)
        setVariantCombinations(convertToVariantCombinations())
      }
    }
  }, [productId, products, convertToVariantCombinations])

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

  const updateVariantCombination = useCallback((id: string, field: keyof VariantCombination, value: any) => {
    setVariantCombinations((prev) =>
      prev.map((combo) => {
        if (combo.id === id) {
          return { ...combo, [field]: value }
        }
        return combo
      }),
    )
  }, [])

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

  // Filter variants based on search term
  const filteredVariants = useMemo(() => {
    if (!debouncedVariantSearch) return variantCombinations

    const searchLower = debouncedVariantSearch.toLowerCase()
    return variantCombinations.filter(
      (variant) =>
        variant.option1?.toLowerCase().includes(searchLower) ||
        false ||
        variant.option2?.toLowerCase().includes(searchLower) ||
        false ||
        variant.option3?.toLowerCase().includes(searchLower) ||
        false ||
        variant.sku.toLowerCase().includes(searchLower),
    )
  }, [variantCombinations, debouncedVariantSearch])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Convert variant combinations back to product variants and images
      const updatedVariants: ProductVariant[] = variantCombinations.map((combo) => {
        // Create variant title from options
        const title = [combo.option1, combo.option2, combo.option3].filter(Boolean).join(" / ")

        return {
          id: combo.id,
          title,
          price: combo.price,
          sku: combo.sku,
          option1: combo.option1,
          option2: combo.option2,
          option3: combo.option3,
          inventory_quantity: combo.inventory_quantity,
          inventory_management: "shopify",
          inventory_policy: "deny",
          image_id: `img-${combo.id}`,
        }
      })

      // Create images for each variant
      const updatedImages: ProductImage[] = variantCombinations.map((combo, index) => {
        return {
          id: `img-${combo.id}`,
          src: combo.image,
          position: index + 1,
          alt: null,
          variant_ids: [combo.id],
        }
      })

      // Create updated product
      const updatedProduct: Product = {
        id: product.id || `product-${Date.now()}`,
        title: product.title,
        body_html: product.body_html,
        vendor: product.vendor,
        product_type: product.product_type,
        status: product.status,
        tags: product.tags,
        variants: updatedVariants,
        options: options,
        images: updatedImages,
        image: updatedImages[0],
      }

      // Update products in context
      if (productId) {
        // Update existing product
        setProducts(products.map((p) => (p.id === productId ? updatedProduct : p)))
      } else {
        // Add new product
        setProducts([...products, updatedProduct])
      }

      toast({
        title: "Product Saved",
        description: `${product.title} has been saved successfully.`,
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
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Product Options</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={options.length >= 3}>
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

                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="individual">Individual View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="space-y-4 pt-4">
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
                              <TableCell colSpan={options.length + 4} className="h-24 text-center">
                                No variants found.
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
                                        if (option.position === 1) updateVariantCombination(combo.id, "option1", value)
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
                                    value={combo.inventory_quantity}
                                    onChange={(e) =>
                                      updateVariantCombination(
                                        combo.id,
                                        "inventory_quantity",
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
                                  <Button variant="ghost" size="sm" onClick={() => removeVariantCombination(combo.id)}>
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
                              value={combo.inventory_quantity}
                              onChange={(e) =>
                                updateVariantCombination(
                                  combo.id,
                                  "inventory_quantity",
                                  Number.parseInt(e.target.value),
                                )
                              }
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
  )
}
