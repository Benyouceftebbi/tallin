"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type DashboardChartProps = {
  type: "orders" | "revenue" | "delivery"
}

export function DashboardChart({ type }: DashboardChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-[200px] flex items-center justify-center text-slate-500">Chargement du graphique...</div>
  }

  // Données pour les commandes par jour
  const ordersData = [
    { name: "Lun", value: 32 },
    { name: "Mar", value: 28 },
    { name: "Mer", value: 36 },
    { name: "Jeu", value: 42 },
    { name: "Ven", value: 45 },
    { name: "Sam", value: 38 },
    { name: "Dim", value: 33 },
  ]

  // Données pour les revenus
  const revenueData = [
    { name: "Lun", value: 3200 },
    { name: "Mar", value: 2800 },
    { name: "Mer", value: 3600 },
    { name: "Jeu", value: 4200 },
    { name: "Ven", value: 4500 },
    { name: "Sam", value: 3800 },
    { name: "Dim", value: 3300 },
  ]

  // Données pour la performance de livraison
  const deliveryData = [
    { name: "Livrés", value: 94.2 },
    { name: "Retournés", value: 5.8 },
  ]

  // Updated color scheme to match the design
  const COLORS = ["#008060", "#f43f5e"]

  if (type === "orders") {
    return (
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ordersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
              itemStyle={{ color: "#f8fafc" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="value" fill="#008060" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === "revenue") {
    return (
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
              itemStyle={{ color: "#f8fafc" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#008060"
              strokeWidth={2}
              dot={{ stroke: "#008060", strokeWidth: 2, fill: "#0f172a", r: 4 }}
              activeDot={{ stroke: "#008060", strokeWidth: 2, fill: "#008060", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (type === "delivery") {
    return (
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={deliveryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="#0f172a"
              strokeWidth={2}
            >
              {deliveryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
              itemStyle={{ color: "#f8fafc" }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value) => [`${value}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return null
}
