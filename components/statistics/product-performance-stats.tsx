"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUp, ArrowDown } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  type TooltipProps,
} from "recharts"

// Top selling products data
const topSellingProducts = [
  { name: "Wireless Earbuds Pro", sales: 1245, revenue: 161850, growth: 15.2 },
  { name: "Premium Leather Wallet", sales: 986, revenue: 59160, growth: 8.7 },
  { name: "Smart Watch Series 5", sales: 879, revenue: 219750, growth: 12.3 },
  { name: "Organic Cotton T-Shirt", sales: 654, revenue: 19620, growth: -2.5 },
  { name: "Stainless Steel Water Bottle", sales: 542, revenue: 13550, growth: 5.8 },
]

// Daily sales data for top product
const dailySalesData = [
  { date: "06/01", sales: 42 },
  { date: "06/02", sales: 38 },
  { date: "06/03", sales: 45 },
  { date: "06/04", sales: 39 },
  { date: "06/05", sales: 47 },
  { date: "06/06", sales: 53 },
  { date: "06/07", sales: 49 },
  { date: "06/08", sales: 55 },
  { date: "06/09", sales: 60 },
  { date: "06/10", sales: 51 },
  { date: "06/11", sales: 48 },
  { date: "06/12", sales: 54 },
  { date: "06/13", sales: 52 },
  { date: "06/14", sales: 58 },
]

// Product category distribution
const categoryDistribution = [
  { name: "Electronics", value: 45 },
  { name: "Clothing", value: 20 },
  { name: "Accessories", value: 15 },
  { name: "Home Goods", value: 12 },
  { name: "Fitness", value: 8 },
]

const COLORS = ["#6366f1", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316"]

// Custom tooltip component for the line chart
const CustomLineTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full bg-[#6366f1]" />
          <p className="text-sm">Sales: {payload[0].value} units</p>
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip component for the pie chart
const CustomPieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          <p className="text-sm">
            {payload[0].value}% ({payload[0].payload.value})
          </p>
        </div>
      </div>
    )
  }
  return null
}

// Custom label for pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius * 1.1
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="#888888" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12}>
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ProductPerformanceStats() {
  // Add fill property to category distribution for pie chart
  const enhancedCategoryData = categoryDistribution.map((entry, index) => ({
    ...entry,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Products with the highest sales volume in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellingProducts.map((product) => (
                <TableRow key={product.name}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sales.toLocaleString()}</TableCell>
                  <TableCell>${product.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {product.growth > 0 ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          {product.growth}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                          <ArrowDown className="mr-1 h-3 w-3" />
                          {Math.abs(product.growth)}%
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Daily Sales - Wireless Earbuds Pro</CardTitle>
          <CardDescription>Daily sales trend for the top selling product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Category Distribution</CardTitle>
          <CardDescription>Sales distribution by product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enhancedCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {enhancedCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  formatter={(value, entry, index) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
