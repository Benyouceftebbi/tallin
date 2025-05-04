"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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

// Delivery company performance data
const deliveryCompanyData = [
  { company: "FedEx", onTime: 98.7, late: 1.3, damaged: 0.5, totalDeliveries: 1245 },
  { company: "UPS", onTime: 97.2, late: 2.8, damaged: 0.8, totalDeliveries: 986 },
  { company: "USPS", onTime: 94.5, late: 5.5, damaged: 1.2, totalDeliveries: 879 },
  { company: "DHL", onTime: 96.8, late: 3.2, damaged: 0.7, totalDeliveries: 654 },
]

// Delivery time data
const deliveryTimeData = [
  { day: "Monday", fedex: 1.8, ups: 2.1, usps: 2.5, dhl: 2.0 },
  { day: "Tuesday", fedex: 1.7, ups: 2.0, usps: 2.4, dhl: 1.9 },
  { day: "Wednesday", fedex: 1.9, ups: 2.2, usps: 2.6, dhl: 2.1 },
  { day: "Thursday", fedex: 2.0, ups: 2.3, usps: 2.7, dhl: 2.2 },
  { day: "Friday", fedex: 2.1, ups: 2.4, usps: 2.8, dhl: 2.3 },
  { day: "Saturday", fedex: 2.3, ups: 2.6, usps: 3.0, dhl: 2.5 },
  { day: "Sunday", fedex: 2.4, ups: 2.7, usps: 3.1, dhl: 2.6 },
]

// Delivery status distribution
const deliveryStatusData = [
  { name: "Delivered", value: 85 },
  { name: "In Transit", value: 10 },
  { name: "Processing", value: 3 },
  { name: "Delayed", value: 2 },
]

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"]

// Custom tooltip for line chart
const LineTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-col gap-2 mt-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm">
                {entry.name}: {entry.value} days
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip for pie chart
const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
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

export function DeliveryPerformanceStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Delivery Company Performance</CardTitle>
          <CardDescription>Comparison of delivery metrics across shipping partners</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>On-Time Rate</TableHead>
                <TableHead>Late Delivery Rate</TableHead>
                <TableHead>Damaged Package Rate</TableHead>
                <TableHead>Total Deliveries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryCompanyData.map((company) => (
                <TableRow key={company.company}>
                  <TableCell className="font-medium">{company.company}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 border-green-200">{company.onTime}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                      {company.late}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                      {company.damaged}%
                    </Badge>
                  </TableCell>
                  <TableCell>{company.totalDeliveries.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Average Delivery Time by Day (Days)</CardTitle>
          <CardDescription>Comparison of delivery times across shipping partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliveryTimeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip content={<LineTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="fedex" stroke="#ef4444" strokeWidth={2} name="FedEx" />
                <Line type="monotone" dataKey="ups" stroke="#3b82f6" strokeWidth={2} name="UPS" />
                <Line type="monotone" dataKey="usps" stroke="#f59e0b" strokeWidth={2} name="USPS" />
                <Line type="monotone" dataKey="dhl" stroke="#22c55e" strokeWidth={2} name="DHL" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Status Distribution</CardTitle>
          <CardDescription>Current status of all shipments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliveryStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
