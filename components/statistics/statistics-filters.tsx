"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { DateRange } from "react-day-picker"

export function StatisticsFilters() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Période:</span>
            <DatePickerWithRange date={date} setDate={setDate} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Boutique:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les boutiques</SelectItem>
                <SelectItem value="tech-haven">Tech Haven</SelectItem>
                <SelectItem value="leather-luxe">Leather Luxe</SelectItem>
                <SelectItem value="eco-apparel">Eco Apparel</SelectItem>
                <SelectItem value="eco-living">Eco Living</SelectItem>
                <SelectItem value="sound-masters">Sound Masters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Catégorie:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="electronics">Électronique</SelectItem>
                <SelectItem value="clothing">Vêtements</SelectItem>
                <SelectItem value="accessories">Accessoires</SelectItem>
                <SelectItem value="home-goods">Articles ménagers</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Transporteur:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner un transporteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les transporteurs</SelectItem>
                <SelectItem value="fedex">FedEx</SelectItem>
                <SelectItem value="ups">UPS</SelectItem>
                <SelectItem value="usps">USPS</SelectItem>
                <SelectItem value="dhl">DHL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
