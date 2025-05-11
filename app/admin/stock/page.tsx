import Link from "next/link"
import {  Box, BarChart2, FileText, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Gestion de stock",
  description: "Gérez votre stock",
}

export default function StockPage() {
  const statuses = [
    {
      title: "Produits",
      description: "Gérer les produits en stock",
      icon: Package,
      href: "/stock/products",
      color: "text-violet-500",
      bgColor: "bg-violet-950/50",
      borderColor: "border-violet-800/50",
    },
    {
      title: "Mouvement",
      description: "Suivre les entrées et sorties de stock",
      icon: Box,
      href: "/stock/movement",
      color: "text-pink-700",
      bgColor: "bg-pink-950/50",
      borderColor: "border-pink-800/50",
    },
    {
      title: "Factures",
      description: "Consulter et gérer les factures",
      icon: FileText,
      href: "/stock/invoices",
      color: "text-emerald-500",
      bgColor: "bg-emerald-950/50",
      borderColor: "border-emerald-800/50",
    },
    {
      title: "Statistiques",
      description: "Voir les rapports et les statistiques",
      icon: BarChart2,
      href: "/stock/statistics",
      color: "text-amber-500",
      bgColor: "bg-amber-950/50",
      borderColor: "border-amber-800/50",
    },

  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion de stock</h1>
        <p className="text-slate-400 mt-2">Sélectionnez une catégorie pour gérer votre stock.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statuses.map((status) => (
          <Link key={status.title} href={status.href} className="block">
            <Card
              className={`border ${status.borderColor} ${status.bgColor} hover:bg-opacity-70 transition-all duration-200`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <status.icon className={`h-5 w-5 ${status.color}`} />
                  <span>{status.title}</span>
                </CardTitle>
                <CardDescription>{status.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400">
                  Cliquez pour voir  {status.title.toLowerCase()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
