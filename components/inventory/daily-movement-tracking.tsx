"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock daily movement data
const dailyMovements = [
  {
    date: "2023-07-01",
    movements: [
      {
        id: "MOV-10001",
        time: "09:23:12",
        productName: "Wireless Earbuds Pro",
        sku: "WEP-001",
        variant: "Black / Medium",
        type: "out",
        individual: 2,
        packs: 0,
        reason: "Customer Order",
        reference: "ORD-9381",
        user: "System",
      },
      {
        id: "MOV-10002",
        time: "10:45:30",
        productName: "Wireless Earbuds Pro",
        sku: "WEP-001",
        variant: "Blue / Small",
        type: "out",
        individual: 3,
        packs: 0,
        reason: "Customer Order",
        reference: "ORD-9382",
        user: "System",
      },
      {
        id: "MOV-10003",
        time: "11:08:33",
        productName: "Smart Watch Series 5",
        sku: "SWS-003",
        variant: "Silver / One Size",
        type: "out",
        individual: 3,
        packs: 1,
        reason: "Customer Order",
        reference: "ORD-9383",
        user: "System",
      },
      {
        id: "MOV-10004",
        time: "12:42:18",
        productName: "Organic Cotton T-Shirt",
        sku: "OCT-004",
        variant: "White / Large",
        type: "out",
        individual: 1,
        packs: 0,
        reason: "Customer Order",
        reference: "ORD-9384",
        user: "System",
      },
      {
        id: "MOV-10005",
        time: "14:15:33",
        productName: "Stainless Steel Water Bottle",
        sku: "SSWB-005",
        variant: "Blue / 20oz",
        type: "out",
        individual: 3,
        packs: 1,
        reason: "Customer Order",
        reference: "ORD-9385",
        user: "System",
      },
      {
        id: "MOV-10006",
        time: "15:30:41",
        productName: "Premium Leather Wallet",
        sku: "PLW-002",
        variant: "Brown / Standard",
        type: "out",
        individual: 2,
        packs: 1,
        reason: "Customer Order",
        reference: "ORD-9386",
        user: "System",
      },
    ],
    summary: {
      totalIn: {
        individual: 0,
        packs: 0,
        value: 0,
      },
      totalOut: {
        individual: 14,
        packs: 3,
        value: 532.87,
      },
    },
  },
  {
    date: "2023-06-30",
    movements: [
      {
        id: "MOV-9995",
        time: "08:15:22",
        productName: "Wireless Earbuds Pro",
        sku: "WEP-001",
        variant: "Black / Medium",
        type: "in",
        individual: 50,
        packs: 10,
        reason: "Purchase Order",
        reference: "PO-4835",
        user: "Alex Johnson",
      },
      {
        id: "MOV-9996",
        time: "09:30:45",
        productName: "Premium Leather Wallet",
        sku: "PLW-002",
        variant: "Brown / Standard",
        type: "out",
        individual: 5,
        packs: 1,
        reason: "Customer Order",
        reference: "ORD-9374",
        user: "System",
      },
      {
        id: "MOV-9997",
        time: "11:20:18",
        productName: "Smart Watch Series 5",
        sku: "SWS-003",
        variant: "Silver / One Size",
        type: "out",
        individual: 2,
        packs: 0,
        reason: "Customer Order",
        reference: "ORD-9375",
        user: "System",
      },
      {
        id: "MOV-9998",
        time: "14:05:33",
        productName: "Stainless Steel Water Bottle",
        sku: "SSWB-005",
        variant: "Blue / 20oz",
        type: "out",
        individual: 4,
        packs: 1,
        reason: "Customer Order",
        reference: "ORD-9376",
        user: "System",
      },
    ],
    summary: {
      totalIn: {
        individual: 50,
        packs: 10,
        value: 650.0,
      },
      totalOut: {
        individual: 11,
        packs: 2,
        value: 478.92,
      },
    },
  },
]

export function DailyMovementTracking() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [viewType, setViewType] = useState<string>("daily")
  const [movementFilter, setMovementFilter] = useState<string>("all")

  // Get the selected date or default to today
  const selectedDate = date?.from ? format(date.from, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

  // Find the movement data for the selected date
  const selectedDayData = dailyMovements.find((d) => d.date === selectedDate) || dailyMovements[0]

  // Filter movements based on the selected filter
  const filteredMovements = selectedDayData.movements.filter((movement) => {
    if (movementFilter === "all") return true
    if (movementFilter === "in") return movement.type === "in"
    if (movementFilter === "out") return movement.type === "out"
    return true
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Daily Movement Tracking</CardTitle>
            <CardDescription>
              Track product movements including sales, receives, and transfers on a daily basis
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs defaultValue="daily" value={viewType} onValueChange={setViewType} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <DatePickerWithRange date={date} setDate={setDate} />

            <Select value={movementFilter} onValueChange={setMovementFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Movement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Movements</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary cards for the selected day */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">In (Individual)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <ArrowDown className="mr-2 h-5 w-5 text-green-500" />
                  {selectedDayData.summary.totalIn.individual}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">In (Packs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <ArrowDown className="mr-2 h-5 w-5 text-green-500" />
                  {selectedDayData.summary.totalIn.packs}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Out (Individual)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <ArrowUp className="mr-2 h-5 w-5 text-red-500" />
                  {selectedDayData.summary.totalOut.individual}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-2">
                <CardTitle className="text-sm font-medium">Out (Packs)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <ArrowUp className="mr-2 h-5 w-5 text-red-500" />
                  {selectedDayData.summary.totalOut.packs}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movement table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU / Variant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.time}</TableCell>
                    <TableCell className="font-medium">{movement.productName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{movement.sku}</span>
                        <span className="text-xs text-muted-foreground">{movement.variant}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.type === "in" ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <ArrowDown className="mr-1 h-3 w-3" />
                          Stock In
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          Stock Out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span>{movement.individual}</span>
                          <span className="text-xs text-muted-foreground">individual</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{movement.packs}</span>
                          <span className="text-xs text-muted-foreground">packs</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{movement.reason}</TableCell>
                    <TableCell>{movement.reference}</TableCell>
                    <TableCell>{movement.user}</TableCell>
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
