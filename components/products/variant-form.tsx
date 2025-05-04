"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash, Upload } from "lucide-react"

type Variant = {
  id: string
  type: string
  options: string[]
}

type VariantCombination = {
  id: string
  combination: Record<string, string>
  buyPrice: number
  sellPrice: number
  quantity: number
  quantityPack: number
  inStock: boolean
  image: string
}

interface VariantFormProps {
  variantCombination: VariantCombination
  variants: Variant[]
  index: number
  onUpdate: (field: keyof VariantCombination, value: any) => void
  onRemove: () => void
}

export function VariantForm({ variantCombination, variants, index, onUpdate, onRemove }: VariantFormProps) {
  const handleUploadImage = () => {
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
          onUpdate("image", imageUrl)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Variant Combination {index + 1}: {Object.values(variantCombination.combination).join(" / ")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Variant Combination</Label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{variant.type}:</span>
                    <span className="text-sm">{variantCombination.combination[variant.id.toLowerCase()]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`buy-price-${variantCombination.id}`}>Buy Price</Label>
                <Input
                  id={`buy-price-${variantCombination.id}`}
                  type="number"
                  step="0.01"
                  value={variantCombination.buyPrice}
                  onChange={(e) => onUpdate("buyPrice", Number.parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sell-price-${variantCombination.id}`}>Sell Price</Label>
                <Input
                  id={`sell-price-${variantCombination.id}`}
                  type="number"
                  step="0.01"
                  value={variantCombination.sellPrice}
                  onChange={(e) => onUpdate("sellPrice", Number.parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`quantity-${variantCombination.id}`}>Quantity (Individual)</Label>
                <Input
                  id={`quantity-${variantCombination.id}`}
                  type="number"
                  value={variantCombination.quantity}
                  onChange={(e) => onUpdate("quantity", Number.parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`quantity-pack-${variantCombination.id}`}>Quantity (Pack)</Label>
                <Input
                  id={`quantity-pack-${variantCombination.id}`}
                  type="number"
                  value={variantCombination.quantityPack}
                  onChange={(e) => onUpdate("quantityPack", Number.parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`in-stock-${variantCombination.id}`}
                checked={variantCombination.inStock}
                onCheckedChange={(checked) => onUpdate("inStock", checked === true)}
              />
              <Label htmlFor={`in-stock-${variantCombination.id}`}>In Stock</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Variant Image</Label>
              <div className="border rounded-md p-4 flex flex-col items-center justify-center space-y-2">
                <div className="h-40 w-40 rounded-md bg-muted flex items-center justify-center">
                  <img
                    src={variantCombination.image || "/placeholder.svg"}
                    alt="Variant"
                    className="max-h-full max-w-full object-cover rounded"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleUploadImage}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            <Trash className="h-4 w-4 mr-2" />
            Remove Variant
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
