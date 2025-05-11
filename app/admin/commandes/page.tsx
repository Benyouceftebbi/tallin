import Link from "next/link"
import { Clock, CheckCircle, Box, ClipboardCheck, Truck, PackageCheck, PackageX } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Gestion des commandes",
  description: "Gérez toutes vos commandes par statut",
}

export default function CommandesPage() {
  const statuses = [
    {
      title: "En attente",
      description: "Commandes en attente de confirmation",
      icon: Clock,
      href: "/commandes/en-attente",
      color: "text-amber-500",
      bgColor: "bg-amber-950/50",
      borderColor: "border-amber-800/50",
    },
    {
      title: "Confirmés",
      description: "Commandes confirmées",
      icon: CheckCircle,
      href: "/commandes/confirmes",
      color: "text-green-500",
      bgColor: "bg-green-950/50",
      borderColor: "border-green-800/50",
    },
    {
      title: "En préparation",
      description: "Commandes en cours de préparation",
      icon: Box,
      href: "/commandes/en-preparation",
      color: "text-blue-500",
      bgColor: "bg-blue-950/50",
      borderColor: "border-blue-800/50",
    },
    {
      title: "Dispatcher",
      description: "Commandes prêtes à être dispatchées",
      icon: ClipboardCheck,
      href: "/commandes/dispatcher",
      color: "text-purple-500",
      bgColor: "bg-purple-950/50",
      borderColor: "border-purple-800/50",
    },
    {
      title: "En livraison",
      description: "Commandes en cours de livraison",
      icon: Truck,
      href: "/commandes/en-livraison",
      color: "text-cyan-500",
      bgColor: "bg-cyan-950/50",
      borderColor: "border-cyan-800/50",
    },
    {
      title: "Livrés",
      description: "Commandes livrées",
      icon: PackageCheck,
      href: "/commandes/livres",
      color: "text-emerald-500",
      bgColor: "bg-emerald-950/50",
      borderColor: "border-emerald-800/50",
    },
    {
      title: "Retour",
      description: "Commandes retournées",
      icon: PackageX,
      href: "/commandes/retour",
      color: "text-red-500",
      bgColor: "bg-red-950/50",
      borderColor: "border-red-800/50",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des commandes</h1>
        <p className="text-slate-400 mt-2">Sélectionnez une catégorie pour gérer les commandes selon leur statut.</p>
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
                  Cliquez pour voir toutes les commandes {status.title.toLowerCase()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
