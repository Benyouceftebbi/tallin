"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Plus, Search, Users, Package } from "lucide-react"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { PurchaseInvoicesTable } from "@/components/invoices/purchase-invoices-table"
import { PurchaseInvoiceForm } from "@/components/invoices/purchase-invoice-form"
import { SalesInvoiceForm } from "@/components/invoices/sales-invoice-form"
import { SuppliersManagement } from "@/components/invoices/suppliers-management"
import { CustomersManagement } from "@/components/invoices/customers-management"
import { PacksManagement } from "@/components/invoices/packs-management"
import { useAppContext } from "@/context/app-context"

export default function InvoicesPage() {
  const { salesInvoices, purchaseInvoices } = useAppContext()

  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false)
  const [isSalesFormOpen, setIsSalesFormOpen] = useState(false)
  const [isSuppliersManagementOpen, setIsSuppliersManagementOpen] = useState(false)
  const [isCustomersManagementOpen, setIsCustomersManagementOpen] = useState(false)
  const [isPacksManagementOpen, setIsPacksManagementOpen] = useState(false)

  // Calculer les statistiques des factures
  const totalInvoices = salesInvoices.length + purchaseInvoices.length

  const pendingInvoices = salesInvoices.filter((inv) => inv.status === "pending")
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  const paidThisMonth = salesInvoices.filter((inv) => {
    const invDate = new Date(inv.date.split("/").reverse().join("-"))
    const now = new Date()
    return inv.status === "paid" && invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear()
  })
  const paidAmount = paidThisMonth.reduce((sum, inv) => sum + inv.amount, 0)

  const overdueInvoices = salesInvoices.filter((inv) => inv.status === "overdue")
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Factures</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsSuppliersManagementOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Fournisseurs
          </Button>
          <Button variant="outline" onClick={() => setIsCustomersManagementOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Clients
          </Button>
          <Button variant="outline" onClick={() => setIsPacksManagementOpen(true)}>
            <Package className="mr-2 h-4 w-4" />
            Packs
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">+{paidThisMonth.length} depuis le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente de paiement</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices.length}</div>
            <p className="text-xs text-muted-foreground">{pendingAmount.toFixed(2)} € en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payées ce mois-ci</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">{paidAmount.toFixed(2)} € encaissés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">{overdueAmount.toFixed(2)} € en retard</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="sales">Factures de vente</TabsTrigger>
            <TabsTrigger value="purchases">Factures d'achat</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher des factures..." className="pl-8" />
          </div>
        </div>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">Factures de vente</h3>
            <Button onClick={() => setIsSalesFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture de vente
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="paid">Payées</TabsTrigger>
              <TabsTrigger value="overdue">En retard</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <InvoicesTable />
            </TabsContent>
            <TabsContent value="pending" className="space-y-4">
              <InvoicesTable filterStatus="pending" />
            </TabsContent>
            <TabsContent value="paid" className="space-y-4">
              <InvoicesTable filterStatus="paid" />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <InvoicesTable filterStatus="overdue" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">Factures d'achat</h3>
            <Button onClick={() => setIsPurchaseFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle facture d'achat
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="pending">En attente</TabsTrigger>
              <TabsTrigger value="paid">Payées</TabsTrigger>
              <TabsTrigger value="overdue">En retard</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <PurchaseInvoicesTable />
            </TabsContent>
            <TabsContent value="pending" className="space-y-4">
              <PurchaseInvoicesTable filterStatus="pending" />
            </TabsContent>
            <TabsContent value="paid" className="space-y-4">
              <PurchaseInvoicesTable filterStatus="paid" />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <PurchaseInvoicesTable filterStatus="overdue" />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <PurchaseInvoiceForm open={isPurchaseFormOpen} onOpenChange={setIsPurchaseFormOpen} />
      <SalesInvoiceForm open={isSalesFormOpen} onOpenChange={setIsSalesFormOpen} />
      <SuppliersManagement open={isSuppliersManagementOpen} onOpenChange={setIsSuppliersManagementOpen} />
      <CustomersManagement open={isCustomersManagementOpen} onOpenChange={setIsCustomersManagementOpen} />
      <PacksManagement open={isPacksManagementOpen} onOpenChange={setIsPacksManagementOpen} />
    </div>
  )
}
