"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, DownloadIcon, DollarSign, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts"

// Mock cash flow data
const cashFlowData = [
  {
    date: "2023-07-01",
    transactions: [
      {
        id: "CF-10001",
        time: "09:23:12",
        description: "Paiement reçu pour la commande #38293",
        type: "inflow",
        amount: 129.99,
        paymentMethod: "Carte bancaire",
        reference: "CMD-38293",
        customer: "Jean Dupont",
      },
      {
        id: "CF-10002",
        time: "10:45:30",
        description: "Paiement reçu pour la commande #38294",
        type: "inflow",
        amount: 249.99,
        paymentMethod: "PayPal",
        reference: "CMD-38294",
        customer: "Sophie Martin",
      },
      {
        id: "CF-10003",
        time: "11:30:15",
        description: "Paiement au fournisseur pour réapprovisionnement",
        type: "outflow",
        amount: 1250.0,
        paymentMethod: "Virement bancaire",
        reference: "BC-4835",
        supplier: "Tech Composants SAS",
      },
      {
        id: "CF-10004",
        time: "14:15:22",
        description: "Paiement reçu pour la commande #38295",
        type: "inflow",
        amount: 59.99,
        paymentMethod: "Apple Pay",
        reference: "CMD-38295",
        customer: "Michel Blanc",
      },
      {
        id: "CF-10005",
        time: "16:40:05",
        description: "Paiement des frais d'expédition",
        type: "outflow",
        amount: 320.5,
        paymentMethod: "Carte bancaire",
        reference: "EXP-2023-07-01",
        supplier: "FedEx",
      },
    ],
    summary: {
      totalInflow: 439.97,
      totalOutflow: 1570.5,
      netCashFlow: -1130.53,
    },
  },
  {
    date: "2023-06-30",
    transactions: [
      {
        id: "CF-9995",
        time: "08:15:22",
        description: "Paiement reçu pour la commande #38290",
        type: "inflow",
        amount: 79.99,
        paymentMethod: "Carte bancaire",
        reference: "CMD-38290",
        customer: "Émilie Wilson",
      },
      {
        id: "CF-9996",
        time: "09:30:45",
        description: "Paiement reçu pour la commande #38291",
        type: "inflow",
        amount: 149.99,
        paymentMethod: "Google Pay",
        reference: "CMD-38291",
        customer: "David Miller",
      },
      {
        id: "CF-9997",
        time: "11:20:18",
        description: "Paiement de facture d'électricité",
        type: "outflow",
        amount: 245.3,
        paymentMethod: "Virement bancaire",
        reference: "UTIL-2023-06",
        supplier: "Électricité de France",
      },
      {
        id: "CF-9998",
        time: "14:05:33",
        description: "Paiement reçu pour la commande #38292",
        type: "inflow",
        amount: 199.99,
        paymentMethod: "Carte bancaire",
        reference: "CMD-38292",
        customer: "Jennifer Taylor",
      },
    ],
    summary: {
      totalInflow: 429.97,
      totalOutflow: 245.3,
      netCashFlow: 184.67,
    },
  },
]

// Daily cash flow chart data
const dailyCashFlowData = [
  { date: "25/06", inflow: 1250, outflow: 850, net: 400 },
  { date: "26/06", inflow: 980, outflow: 1200, net: -220 },
  { date: "27/06", inflow: 1450, outflow: 950, net: 500 },
  { date: "28/06", inflow: 1100, outflow: 780, net: 320 },
  { date: "29/06", inflow: 890, outflow: 1050, net: -160 },
  { date: "30/06", inflow: 1300, outflow: 1150, net: 150 },
  { date: "01/07", inflow: 1500, outflow: 1350, net: 150 },
  { date: "02/07", inflow: 1200, outflow: 900, net: 300 },
  { date: "03/07", inflow: 1350, outflow: 1100, net: 250 },
  { date: "04/07", inflow: 1000, outflow: 1200, net: -200 },
  { date: "05/07", inflow: 1450, outflow: 950, net: 500 },
  { date: "06/07", inflow: 1300, outflow: 1050, net: 250 },
  { date: "07/07", inflow: 1550, outflow: 1250, net: 300 },
  { date: "08/07", inflow: 1400, outflow: 1150, net: 250 },
]

// Custom tooltip for chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm">Encaissements: {payload[0].value} €</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-sm">Décaissements: {payload[1].value} €</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-sm">Net: {payload[2].value} €</p>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function CashFlowTracking() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [viewType, setViewType] = useState<string>("daily")
  const [transactionFilter, setTransactionFilter] = useState<string>("all")

  // Get the selected date or default to today
  const selectedDate = date?.from ? format(date.from, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

  // Find the cash flow data for the selected date
  const selectedDayData = cashFlowData.find((d) => d.date === selectedDate) || cashFlowData[0]

  // Filter transactions based on the selected filter
  const filteredTransactions = selectedDayData.transactions.filter((transaction) => {
    if (transactionFilter === "all") return true
    if (transactionFilter === "inflow") return transaction.type === "inflow"
    if (transactionFilter === "outflow") return transaction.type === "outflow"
    return true
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Suivi des flux de trésorerie</CardTitle>
            <CardDescription>Suivez les encaissements et décaissements quotidiens</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs defaultValue="daily" value={viewType} onValueChange={setViewType} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Quotidien</TabsTrigger>
                <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
                <TabsTrigger value="monthly">Mensuel</TabsTrigger>
              </TabsList>
            </Tabs>

            <DatePickerWithRange date={date} setDate={setDate} />

            <Select value={transactionFilter} onValueChange={setTransactionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de transaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les transactions</SelectItem>
                <SelectItem value="inflow">Encaissements</SelectItem>
                <SelectItem value="outflow">Décaissements</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Plus de filtres
            </Button>

            <Button variant="outline">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cash Flow Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tendance des flux de trésorerie</CardTitle>
              <CardDescription>Encaissements et décaissements quotidiens des 14 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyCashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${value} €`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => {
                        if (value === "inflow") return "Encaissements"
                        if (value === "outflow") return "Décaissements"
                        if (value === "net") return "Flux net"
                        return value
                      }}
                    />
                    <Bar dataKey="inflow" name="inflow" fill="#22c55e" stackId="a" />
                    <Bar dataKey="outflow" name="outflow" fill="#ef4444" stackId="a" />
                    <Line type="monotone" dataKey="net" name="net" stroke="#3b82f6" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards for the selected day */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Encaissements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center text-green-600">
                  <ArrowDown className="mr-2 h-5 w-5" />
                  {selectedDayData.summary.totalInflow.toFixed(2)} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Décaissements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center text-red-600">
                  <ArrowUp className="mr-2 h-5 w-5" />
                  {selectedDayData.summary.totalOutflow.toFixed(2)} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Flux net</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold flex items-center ${
                    selectedDayData.summary.netCashFlow >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  {selectedDayData.summary.netCashFlow.toFixed(2)} €
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Moyen de paiement</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client/Fournisseur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.time}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      {transaction.type === "inflow" ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <ArrowDown className="mr-1 h-3 w-3" />
                          Encaissement
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          Décaissement
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={transaction.type === "inflow" ? "text-green-600" : "text-red-600"}>
                      {transaction.amount.toFixed(2)} €
                    </TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell>{transaction.reference}</TableCell>
                    <TableCell>{transaction.customer || transaction.supplier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
