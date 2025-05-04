"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Plus, Search, TrendingUp, Package, DollarSign, BarChart3 } from "lucide-react"
import { ProductsTable } from "@/components/products/products-table"
import { ProductEditSheet } from "@/components/products/product-edit-sheet"

export function ProductsPageClient() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Produits</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => setIsAddProductOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 248</div>
            <p className="text-xs text-muted-foreground">+12 depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure vente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Écouteurs sans fil Pro</div>
            <p className="text-xs text-muted-foreground">1 245 unités vendues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 231,89 €</div>
            <p className="text-xs text-muted-foreground">+20,1% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge bénéficiaire</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42,5%</div>
            <p className="text-xs text-muted-foreground">+1,2% par rapport au mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">Tous les produits</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="draft">Brouillons</TabsTrigger>
            <TabsTrigger value="archived">Archivés</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher des produits..." className="pl-8" />
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <ProductsTable />
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <ProductsTable filterStatus="active" />
        </TabsContent>
        <TabsContent value="draft" className="space-y-4">
          <ProductsTable filterStatus="draft" />
        </TabsContent>
        <TabsContent value="archived" className="space-y-4">
          <ProductsTable filterStatus="archived" />
        </TabsContent>
      </Tabs>

      <ProductEditSheet open={isAddProductOpen} onOpenChange={setIsAddProductOpen} />
    </div>
  )
}
