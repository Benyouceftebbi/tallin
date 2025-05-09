"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Download, Loader2 } from "lucide-react"
import axios from "axios"
import { useAppContext } from "@/context/app-context"
import { db } from "@/lib/firebase"
import { collection, doc, writeBatch } from "firebase/firestore"

export function ShopifyImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [shopDomain, setShopDomain] = useState("tallin-dz.com")
  const [accessToken, setAccessToken] = useState("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")
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })

  const { addProduct } = useAppContext()

  const importProductsFromShopify = async () => {
    if (!shopDomain || !accessToken) {
      toast({
        title: "Erreur de configuration",
        description: "Veuillez saisir le domaine de la boutique et le token d'accès.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportProgress({ current: 0, total: 0 })

    try {
      toast({
        title: "Importation démarrée",
        description: "Récupération des produits depuis Shopify...",
      })

      const response = await axios.post('/api/shopify/products', {
        shopDomain,
        accessToken,
      });
      
      const activeProducts = response.data.products
      setImportProgress({ current: 0, total: activeProducts.length })

      toast({
        title: "Produits récupérés",
        description: `${activeProducts.length} produits trouvés. Importation en cours...`,
      })
      const batch = writeBatch(db);

      for (const product of activeProducts) {
        const productRef = doc(collection(db, "Products"), product.id.toString());
      
        batch.set(productRef, {
          ...product,
          variants: [],
          images: [],
        });
      
        for (const variant of product.variants) {
          const variantRef = doc(collection(productRef, "variants"), variant.id.toString());
      
          batch.set(variantRef, {
            ...variant,
            inventory_quantity: 0,
          });
        }
      }
      
      await batch.commit();
      // Process products
      for (let i = 0; i < activeProducts.length; i++) {
        const shopifyProduct = activeProducts[i]

        // Convert Shopify product to your app's format
        const product = {
            ...shopifyProduct,variants:shopifyProduct.variants.map((variant) => ({
                ...variant,inventory_quantity:0
              })),images:[],
    
        }

        // Add to your app context
        addProduct(product)

        // Update progress
        setImportProgress({ current: i + 1, total: activeProducts.length })
      }

      toast({
        title: "Importation réussie",
        description: `${activeProducts.length} produits importés avec succès.`,
      })


        setIsOpen(false)
        setIsImporting(false)

    } catch (error) {
      console.error("Erreur lors de l'importation:", error)
      toast({
        title: "Erreur d'importation",
        description: "Une erreur est survenue lors de l'importation des produits.",
        variant: "destructive",
      })
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Importer depuis Shopify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importer les produits depuis Shopify</DialogTitle>
          <DialogDescription>Connectez-vous à votre boutique Shopify pour importer vos produits.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shop-domain" className="col-span-4">
              Domaine de la boutique
            </Label>
            <Input
              id="shop-domain"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="votre-boutique.myshopify.com"
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="access-token" className="col-span-4">
              Token d'accès API
            </Label>
            <Input
              id="access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="shpat_..."
              className="col-span-4"
            />
          </div>

          {isImporting && importProgress.total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression</span>
                <span>
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={importProductsFromShopify} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importation en cours...
              </>
            ) : (
              "Importer les produits"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
