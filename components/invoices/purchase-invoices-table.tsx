"use client"

import { useState } from "react"
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
import { ArrowUpDown, Download, Eye, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useShop } from "@/context/shop-context"

type PurchaseInvoice = {
  id: string
  invoiceNumber: string
  supplier: string
  date: string
  dueDate: string
  amount: number
  status: "pending" | "paid" | "overdue"
}



export function PurchaseInvoicesTable({ filterStatus }: { filterStatus?: "pending" | "paid" | "overdue" }) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const {invoices}=useShop()
  const purchaseInvoices=invoices?invoices:[]
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const filteredInvoices = filterStatus
    ? purchaseInvoices.filter((invoice) => invoice.status === filterStatus)
    : purchaseInvoices

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn as keyof PurchaseInvoice]
    const bValue = b[sortColumn as keyof PurchaseInvoice]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead className="min-w-[150px]">
              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("invoiceNumber")}>
                <span>Facture</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("supplier")}>
                <span>Fournisseur</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("date")}>
                <span>Date</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("dueDate")}>
                <span>Échéance</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("amount")}>
                <span>Montant</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices?.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>{invoice.supplier.name}</TableCell>
              <TableCell>{invoice.date}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>{invoice?.total?.toFixed(2)} €</TableCell>
              <TableCell>
                {invoice.status === "paid" && (
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40">
                    Payée
                  </Badge>
                )}
                {invoice.status === "pending" && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border-yellow-400/20"
                  >
                    En attente
                  </Badge>
                )}
                {invoice.status === "overdue" && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-400/20"
                  >
                    En retard
                  </Badge>
                )}
              </TableCell>
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
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Annuler la facture</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
