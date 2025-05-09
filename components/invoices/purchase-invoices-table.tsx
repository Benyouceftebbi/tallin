"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Eye, MoreHorizontal, Download, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useShop } from "@/context/shop-context"
import { PurchaseInvoiceForm } from "./purchase-invoice-form"

export function PurchaseInvoicesTable({ filterStatus }) {
  // State for sorting
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")

  // State for editing
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  // Get invoices from shop context
  const { invoices = [] } = useShop() || {}

  // Handle sorting when a column header is clicked
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Handle edit button click
  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice)
    setIsEditFormOpen(true)
  }

  // Handle form close
  const handleFormClose = () => {
    setEditingInvoice(null)
    setIsEditFormOpen(false)
  }

  // Filter invoices by status if filterStatus is provided
  const filteredInvoices = filterStatus ? invoices.filter((invoice) => invoice.status === filterStatus) : invoices

  // Sort invoices based on the selected column and direction
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  return (
    <>
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
                <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort("total")}>
                  <span>Montant</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.length > 0 ? (
              sortedInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{invoice.supplier?.name || "N/A"}</TableCell>
                  <TableCell>{invoice.date || "N/A"}</TableCell>
                  <TableCell>{invoice.dueDate || "N/A"}</TableCell>
                  <TableCell>{(invoice.total || 0).toFixed(2)} €</TableCell>
                  <TableCell>
                    {invoice.status === "paid" && <Badge className="bg-green-100 text-green-800">Payée</Badge>}
                    {invoice.status === "pending" && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-400/20">
                        En attente
                      </Badge>
                    )}
                    {invoice.status === "overdue" && (
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-400/20">
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
                        <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </Link>
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Aucune facture trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Invoice Form */}
      {isEditFormOpen && editingInvoice && (
        <PurchaseInvoiceForm
          open={isEditFormOpen}
          onOpenChange={(open) => {
            setIsEditFormOpen(open)
            if (!open) handleFormClose()
          }}
          initialData={editingInvoice}
          isEditing={true}
        />
      )}
    </>
  )
}
