"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp, Eye, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Movement = {
  id: string
  date: string
  type: "inflow" | "outflow"
  product: string
  quantity: number
  reason: string
  reference: string
  user: string
}

const movements: Movement[] = [
  {
    id: "MOV-1001",
    date: "2023-06-15 09:23:12",
    type: "inflow",
    product: "Écouteurs sans fil Pro",
    quantity: 50,
    reason: "Bon de commande",
    reference: "BC-4832",
    user: "Alex Johnson",
  },
  {
    id: "MOV-1002",
    date: "2023-06-15 10:45:30",
    type: "outflow",
    product: "Écouteurs sans fil Pro",
    quantity: 2,
    reason: "Commande client",
    reference: "CMD-9371",
    user: "Système",
  },
  {
    id: "MOV-1003",
    date: "2023-06-14 14:12:05",
    type: "inflow",
    product: "Portefeuille en cuir premium",
    quantity: 100,
    reason: "Bon de commande",
    reference: "BC-4833",
    user: "Alex Johnson",
  },
  {
    id: "MOV-1004",
    date: "2023-06-14 15:30:22",
    type: "outflow",
    product: "Montre connectée Série 5",
    quantity: 5,
    reason: "Commande client",
    reference: "CMD-9372",
    user: "Système",
  },
  {
    id: "MOV-1005",
    date: "2023-06-13 11:05:45",
    type: "outflow",
    product: "T-shirt en coton bio",
    quantity: 10,
    reason: "Commande client",
    reference: "CMD-9373",
    user: "Système",
  },
  {
    id: "MOV-1006",
    date: "2023-06-13 09:15:33",
    type: "inflow",
    product: "Bouteille d'eau en acier inoxydable",
    quantity: 75,
    reason: "Bon de commande",
    reference: "BC-4834",
    user: "Maria Garcia",
  },
  {
    id: "MOV-1007",
    date: "2023-06-12 16:42:18",
    type: "outflow",
    product: "Portefeuille en cuir premium",
    quantity: 3,
    reason: "Commande client",
    reference: "CMD-9374",
    user: "Système",
  },
  {
    id: "MOV-1008",
    date: "2023-06-12 10:30:55",
    type: "outflow",
    product: "Bouteille d'eau en acier inoxydable",
    quantity: 8,
    reason: "Commande client",
    reference: "CMD-9375",
    user: "Système",
  },
]

export function InventoryMovements() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Heure</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="font-medium">{movement.date}</TableCell>
              <TableCell>
                {movement.type === "inflow" ? (
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    Entrée
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-400/20"
                  >
                    <ArrowUp className="mr-1 h-3 w-3" />
                    Sortie
                  </Badge>
                )}
              </TableCell>
              <TableCell>{movement.product}</TableCell>
              <TableCell>{movement.quantity}</TableCell>
              <TableCell>{movement.reason}</TableCell>
              <TableCell>{movement.reference}</TableCell>
              <TableCell>{movement.user}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Ouvrir le menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les détails
                    </DropdownMenuItem>
                    <DropdownMenuItem>Imprimer l'enregistrement</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Annuler le mouvement</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
