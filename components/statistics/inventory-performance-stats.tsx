"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts"

// Inventory value over time
const inventoryValueData = [
  { month: "Jan", value: 980000 },
  { month: "Feb", value: 1020000 },
  { month: "Mar", value: 1150000 },
  { month: "Apr", value: 1080000 },
  { month: "May", value: 1190000 },
  { month: "Jun", value: 1245890 },
]

// Inventory turnover by category
const inventoryTurnoverData = [
  { category: "Electronics", turnover: 5.2, daysInStock: 70 },
  { category: "Clothing", turnover: 6.8, daysInStock: 54 },
  { category: "Accessories", turnover: 4.5, daysInStock: 81 },
  { category: "Home Goods", turnover: 3.7, daysInStock: 99 },
  { category: "Fitness", turnover: 4.1, daysInStock: 89 },
]

// Stock level alerts
const stockAlertData = [
  { product: "Wireless Earbuds Pro (Black/Medium)", sku: "WEP-001-BM", current: 12, min: 20, status: "low" },
  { product: "Smart Watch Series 5 (Silver)", sku: "SWS-003-S", current: 8, min: 15, status: "low" },
  { product: "Premium Leather Wallet (Brown)", sku: "PLW-002-BR", current: 5, min: 10, status: "critical" },
  { product: "Stainless Steel Water Bottle (Blue)", sku: "SSWB-005-BL", current: 18, min: 20, status: "low" },
  { product: "Organic Cotton T-Shirt (White/XL)", sku: "OCT-004-WXL", current: 3, min: 15, status: "critical" },
]

// Custom tooltip for area chart
const AreaTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full bg-[#0ea5e9]" />
          <p className="text-sm">Value: ${payload[0].value.toLocaleString()}</p>
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip for composed chart
const ComposedTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#6366f1]" />
            <p className="text-sm">Turnover: {payload[0].value}x per year</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <p className="text-sm">Days in Stock: {payload[1].value}</p>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function InventoryPerformanceStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Inventory Value Over Time</CardTitle>
          <CardDescription>Total inventory value trend over the past 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryValueData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<AreaTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={0.2} fill="url(#colorValue)" />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Inventory Turnover by Category</CardTitle>
          <CardDescription>Turnover rate and average days in stock by product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={inventoryTurnoverData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<ComposedTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="turnover" fill="#6366f1" radius={[4, 4, 0, 0]} name="Turnover Rate" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="daysInStock"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Days in Stock"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>Products that need immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockAlertData.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell>
                    <div className="font-medium">{item.product}</div>
                    <div className="text-xs text-muted-foreground">{item.sku}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-medium">{item.current}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {item.min} min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.status === "critical" ? (
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                        Critical
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                        Low
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
