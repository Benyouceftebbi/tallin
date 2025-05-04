"use client"

import { useAppContext } from "@/contexts/app-context"
import { Avatar } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

export function TopProducts() {
  const { products } = useAppContext()

  // Trier les produits par stock
  const sortedProducts = [...products]
    .flatMap((product) =>
      product.variants.map((variant) => ({
        name: product.name,
        category: product.category,
        sales: Math.floor(Math.random() * 1000) + 500, // Simuler des ventes
        stock: variant.stock,
        image: `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(product.name)}`,
      })),
    )
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {sortedProducts.map((product) => (
        <div key={product.name} className="flex items-center">
          <Avatar className="h-9 w-9 mr-3">
            <img src={product.image || "/placeholder.svg"} alt={product.name} />
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex justify-between">
              <p className="text-sm font-medium leading-none">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sales} vendus</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{product.category}</p>
              <p className="text-xs text-muted-foreground">{product.stock} en stock</p>
            </div>
            <Progress value={Math.min(100, (product.stock / 300) * 100)} className="h-1 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
