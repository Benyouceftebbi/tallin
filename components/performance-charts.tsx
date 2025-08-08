"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import type { Order } from "@/lib/performance-data"

interface PerformanceChartsProps {
  orders: Order[]
  isLoading: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function PerformanceCharts({ orders, isLoading }: PerformanceChartsProps) {
  // Prepare time series data
  const timeSeriesData = orders.reduce((acc: any, order) => {
    const date = order.date
    if (!acc[date]) {
      acc[date] = {
        date,
        'En attente': 0,
        'Confirmé': 0,
        'En livraison': 0,
        'Livré': 0,
        'Retourné': 0
      }
    }
    
    // Map order status to chart categories
    if (order.status === 'En attente') acc[date]['En attente']++
    else if (order.confirmationStatus === 'Confirmé') acc[date]['Confirmé']++
    else if (order.lastStatus === 'out-for-delivery') acc[date]['En livraison']++
    else if (order.lastStatus === 'delivered' || order.status === 'Livrés') acc[date]['Livré']++
    else if (order.status === 'Retourné') acc[date]['Retourné']++
    
    return acc
  }, {})

  const timeSeriesArray = Object.values(timeSeriesData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Prepare confirmatrice data
  const confirmatriceData = orders.reduce((acc: any, order) => {
    if (!acc[order.confirmatrice]) {
      acc[order.confirmatrice] = {
        name: order.confirmatrice,
        'En attente': 0,
        'Confirmé': 0,
        'En livraison': 0,
        'Livré': 0,
        'Retourné': 0
      }
    }
    
    const stats = acc[order.confirmatrice]
    if (order.status === 'En attente') stats['En attente']++
    else if (order.confirmationStatus === 'Confirmé') stats['Confirmé']++
    else if (order.lastStatus === 'out-for-delivery') stats['En livraison']++
    else if (order.lastStatus === 'delivered' || order.status === 'Livrés') stats['Livré']++
    else if (order.status === 'Retourné') stats['Retourné']++
    
    return acc
  }, {})

  const confirmatriceArray = Object.values(confirmatriceData)

  // Prepare articles data
  const articlesData = orders.reduce((acc: any, order) => {
    order.articles.forEach(article => {
      acc[article.product_name] = (acc[article.product_name] || 0) + article.quantity
    })
    return acc
  }, {})

  const articlesArray = Object.entries(articlesData)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 8)

  const chartConfig = {
    "En attente": {
      label: "En attente",
      color: "#3b82f6",
    },
    "Confirmé": {
      label: "Confirmé",
      color: "#10b981",
    },
    "En livraison": {
      label: "En livraison",
      color: "#f59e0b",
    },
    "Livré": {
      label: "Livré",
      color: "#059669",
    },
    "Retourné": {
      label: "Retourné",
      color: "#ef4444",
    },
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Évolution des commandes dans le temps</CardTitle>
          <CardDescription>
            Suivi des différents statuts de commandes par jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="En attente" stroke={chartConfig["En attente"].color} strokeWidth={2} />
                <Line type="monotone" dataKey="Confirmé" stroke={chartConfig["Confirmé"].color} strokeWidth={2} />
                <Line type="monotone" dataKey="En livraison" stroke={chartConfig["En livraison"].color} strokeWidth={2} />
                <Line type="monotone" dataKey="Livré" stroke={chartConfig["Livré"].color} strokeWidth={2} />
                <Line type="monotone" dataKey="Retourné" stroke={chartConfig["Retourné"].color} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance par confirmatrice</CardTitle>
          <CardDescription>
            Répartition des commandes par confirmatrice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confirmatriceArray}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="En attente" stackId="a" fill={chartConfig["En attente"].color} />
                <Bar dataKey="Confirmé" stackId="a" fill={chartConfig["Confirmé"].color} />
                <Bar dataKey="En livraison" stackId="a" fill={chartConfig["En livraison"].color} />
                <Bar dataKey="Livré" stackId="a" fill={chartConfig["Livré"].color} />
                <Bar dataKey="Retourné" stackId="a" fill={chartConfig["Retourné"].color} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Articles</CardTitle>
          <CardDescription>
            Articles les plus commandés par quantité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={articlesArray}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {articlesArray.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
