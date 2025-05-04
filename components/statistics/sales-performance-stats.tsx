"use client"

import { useAppContext } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  type TooltipProps,
} from "recharts"

// Custom tooltip for sales trend
const SalesTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#6366f1]" />
            <p className="text-sm">Ventes: ${payload[0].value}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
            <p className="text-sm">Commandes: {payload[1].value}</p>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Custom tooltip for bar charts
const BarTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
          <p className="text-sm">Ventes: ${payload[0].value}</p>
        </div>
      </div>
    )
  }
  return null
}

export function SalesPerformanceStats() {
  const { dailySales, salesInvoices } = useAppContext()
  const [timeframe, setTimeframe] = useState("daily")

  // Données pour les ventes par heure
  const salesByHourData = [
    { hour: "00:00", sales: 120 },
    { hour: "01:00", sales: 80 },
    { hour: "02:00", sales: 60 },
    { hour: "03:00", sales: 40 },
    { hour: "04:00", sales: 30 },
    { hour: "05:00", sales: 50 },
    { hour: "06:00", sales: 90 },
    { hour: "07:00", sales: 150 },
    { hour: "08:00", sales: 230 },
    { hour: "09:00", sales: 320 },
    { hour: "10:00", sales: 450 },
    { hour: "11:00", sales: 580 },
    { hour: "12:00", sales: 650 },
    { hour: "13:00", sales: 720 },
    { hour: "14:00", sales: 680 },
    { hour: "15:00", sales: 590 },
    { hour: "16:00", sales: 520 },
    { hour: "17:00", sales: 480 },
    { hour: "18:00", sales: 430 },
    { hour: "19:00", sales: 390 },
    { hour: "20:00", sales: 350 },
    { hour: "21:00", sales: 280 },
    { hour: "22:00", sales: 220 },
    { hour: "23:00", sales: 170 },
  ]

  // Calculer les ventes par méthode de paiement
  const paymentMethods = ["Carte bancaire", "PayPal", "Apple Pay", "Google Pay", "Virement bancaire"]
  const salesByPaymentData = paymentMethods.map((method) => ({
    method,
    sales: Math.floor(Math.random() * 20000) + 5000,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tendance des ventes</CardTitle>
            <CardDescription>Ventes et commandes quotidiennes sur la période sélectionnée</CardDescription>
          </div>
          <Tabs defaultValue="daily" value={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              <TabsTrigger value="daily">Quotidien</TabsTrigger>
              <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
              <TabsTrigger value="monthly">Mensuel</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailySales} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${value}`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<SalesTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  fill="#6366f1"
                  stroke="#6366f1"
                  fillOpacity={0.2}
                  name="Ventes ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Commandes"
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Ventes par heure de la journée</CardTitle>
          <CardDescription>Distribution des ventes tout au long de la journée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByHourData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} name="Ventes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventes par méthode de paiement</CardTitle>
          <CardDescription>Distribution des ventes par type de paiement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesByPaymentData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                <YAxis type="category" dataKey="method" width={100} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Ventes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
