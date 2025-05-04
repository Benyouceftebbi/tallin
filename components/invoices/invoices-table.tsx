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
import { ArrowUpDown, Download, Eye, MoreHorizontal, Send } from "lucide-react"
import Link from "next/link"

type Invoice = {
  id: string
  invoiceNumber: string
  customer: string
  date: string
  dueDate: string
  amount: number
  status: "pending" | "paid" | "overdue"
}

const invoices: Invoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "FACT-001-2023",
    customer: "Acme Inc.",
    date: "01/06/2023",
    dueDate: "15/06/2023",
    amount: 1250.0,
    status: "paid",
  },
  {
    id: "INV-002",
    invoiceNumber: "FACT-002-2023",
    customer: "Globex Corporation",
    date: "05/06/2023",
    dueDate: "19/06/2023",
    amount: 3450.75,
    status: "paid",
  },
  {
    id: "INV-003",
    invoiceNumber: "FACT-003-2023",
    customer: "Stark Industries",
    date: "10/06/2023",
    dueDate: "24/06/2023",
    amount: 2100.5,
    status: "pending",
  },
  {
    id: "INV-004",
    invoiceNumber: "FACT-004-2023",
    customer: "Wayne Enterprises",
    date: "12/06/2023",
    dueDate: "26/06/2023",
    amount: 4500.0,
    status: "pending",
  },
  {
    id: "INV-005",
    invoiceNumber: "FACT-005-2023",
    customer: "Umbrella Corporation",
    date: "20/05/2023",
    dueDate: "03/06/2023",
    amount: 1800.25,
    status: "overdue",
  },
  {
    id: "INV-006",
    invoiceNumber: "FACT-006-2023",
    customer: "Cyberdyne Systems",
    date: "25/05/2023",
    dueDate: "08/06/2023",
    amount: 950.0,
    status: "overdue",
  },
  {
    id: "INV-007",
    invoiceNumber: "FACT-007-2023",
    customer: "Soylent Corp",
    date: "15/06/2023",
    dueDate: "29/06/2023",
    amount: 2750.5,
    status: "pending",
  },
  {
    id: "INV-008",
    invoiceNumber: "FACT-008-2023",
    customer: "Initech",
    date: "18/06/2023",
    dueDate: "02/07/2023",
    amount: 1500.75,
    status: "pending",
  },
]

export function InvoicesTable({ filterStatus }: { filterStatus?: "pending" | "paid" | "overdue" }) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const filteredInvoices = filterStatus ? invoices.filter((invoice) => invoice.status === filterStatus) : invoices

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn as keyof Invoice]
    const bValue = b[sortColumn as keyof Invoice]

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
              <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("customer")}>
                <span>Client</span>
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
          {sortedInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                  {invoice.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{invoice.date}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>{invoice.amount.toFixed(2)} €</TableCell>
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
                    <DropdownMenuItem>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer au client
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
