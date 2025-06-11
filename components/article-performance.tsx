"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, AlertTriangle } from "lucide-react"
import { useShop } from "@/context/shop-context"

const articleData = [
  { name: "Téléphones", orders: 145, confirmed: 128, return_rate: 8.3, revenue: 45600 },
  { name: "Laptops", orders: 89, confirmed: 82, return_rate: 5.6, revenue: 67800 },
  { name: "Montres", orders: 234, confirmed: 198, return_rate: 12.1, revenue: 23400 },
  { name: "Écouteurs", orders: 167, confirmed: 152, return_rate: 7.2, revenue: 15600 },
]

const chartConfig = {
  orders: {
    label: "Commandes",
    color: "hsl(217, 91%, 60%)",
  },
  confirmed: {
    label: "Confirmées",
    color: "hsl(142, 71%, 45%)",
  },
}
function generateArticleData(orders) {
  const articleStats = {};

  for (const order of orders) {
    if (!Array.isArray(order.articles)) continue;

    for (const article of order.articles) {
      const productName = article.product_name || "Inconnu";
      const productKey = productName.trim().toLowerCase();

      if (!articleStats[productKey]) {
        articleStats[productKey] = {
          name: productName,
          orders: 0,
          confirmed: 0,
          returned: 0,
          revenue: 0,
        };
      }

      const stats = articleStats[productKey];
      stats.orders += 1;

      if (order.confirmationStatus === "Confirmé") {
        stats.confirmed += 1;

        const quantity = Number(article.quantity) || 0;
        const price = parseFloat(article.unit_price) || 0;
        stats.revenue += quantity * price;
      }

      if (order.status === "Retour") {
        stats.returned += 1;
      }
    }
  }

  // Convert to array and calculate return rate
  return Object.values(articleStats).map((item) => ({
    name: item.name,
    orders: item.orders,
    confirmed: item.confirmed,
    return_rate: Number(((item.returned / item.orders) * 100).toFixed(1)),
    revenue: Math.round(item.revenue),
  }));
}
export function ArticlePerformance() {
const { filteredOrders, loading } = useShop();
const articleData = generateArticleData(filteredOrders);

const bestPerformer =
  articleData.length > 0
    ? articleData.reduce((prev, current) =>
        current.confirmed / current.orders > prev.confirmed / prev.orders ? current : prev
      )
    : null;

const highestReturn =
  articleData.length > 0
    ? articleData.reduce((prev, current) =>
        current.return_rate > prev.return_rate ? current : prev
      )
    : null;
return (
  <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
    <CardHeader>
      <CardTitle className="text-slate-100 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Performance par Article
      </CardTitle>
      <CardDescription>Analyse des ventes et confirmations par catégorie</CardDescription>
    </CardHeader>

    <CardContent className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
      {/* Performance Indicators */}
      {articleData.length > 0 && bestPerformer && highestReturn && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-400">Meilleur taux</span>
            </div>
            <p className="text-sm font-medium text-slate-100">{bestPerformer.name}</p>
            <p className="text-xs text-slate-400">
              {Math.round((bestPerformer.confirmed / bestPerformer.orders) * 100)}% confirmé
            </p>
          </div>

          <div className="p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-400">Plus de retours</span>
            </div>
            <p className="text-sm font-medium text-slate-100">{highestReturn.name}</p>
            <p className="text-xs text-slate-400">{highestReturn.return_rate}% retours</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {articleData.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={articleData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="confirmedArticleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-confirmed)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-confirmed)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value, name) => [
                  `${value} commandes`,
                  name === "orders" ? "Total commandes" : "Confirmées",
                ]}
                labelFormatter={(label) => `${label}`}
              />
              <Bar dataKey="orders" fill="url(#ordersGradient)" radius={[4, 4, 0, 0]} name="orders" />
              <Bar dataKey="confirmed" fill="url(#confirmedArticleGradient)" radius={[4, 4, 0, 0]} name="confirmed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <p className="text-sm text-slate-400">Aucune donnée disponible pour les articles.</p>
      )}

      {/* Article Details */}
      <div className="space-y-3">
        {articleData.map((article) => (
          <div key={article.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-100">{article.name}</p>
              <p className="text-xs text-slate-400">
                {article.orders} commandes • {article.confirmed} confirmées
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-100">{article.revenue.toLocaleString()} DZD</p>
              <Badge
                variant="secondary"
                className={`text-xs ${
                  article.return_rate > 10 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                }`}
              >
                {article.return_rate}% retours
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
}
