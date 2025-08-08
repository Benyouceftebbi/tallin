"use client"

import { useState } from "react"
import { CalendarIcon } from 'lucide-react'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MultiSelect } from "@/components/multi-select"
import type { Order } from "@/lib/performance-data"

export interface FiltersState {
  from: string
  to: string
  confirmatrices: string[]
  articles: string[]
}

interface PerformanceFiltersProps {
  filters: FiltersState
  onFiltersChange: (filters: FiltersState) => void
  orders: Order[]
}

export function PerformanceFilters({ filters, onFiltersChange, orders }: PerformanceFiltersProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.from ? new Date(filters.from) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.to ? new Date(filters.to) : undefined
  )

  // Extract unique confirmatrices and articles from orders
  const confirmatriceOptions = Array.from(
    new Set(orders.map(order => order.confirmatrice))
  ).map(confirmatrice => ({
    label: confirmatrice,
    value: confirmatrice
  }))

  const articleOptions = Array.from(
    new Set(orders.flatMap(order => 
      order.articles.map(article => article.product_name)
    ))
  ).map(article => ({
    label: article,
    value: article
  }))

  const handleApplyFilters = () => {
    onFiltersChange({
      from: dateFrom ? dateFrom.toISOString() : "",
      to: dateTo ? dateTo.toISOString() : "",
      confirmatrices: filters.confirmatrices,
      articles: filters.articles,
    })
  }

  const handleResetFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    onFiltersChange({
      from: "",
      to: "",
      confirmatrices: [],
      articles: [],
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date de début</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date de fin</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP", { locale: fr }) : "Sélectionner une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirmatrices</label>
          <MultiSelect
            options={confirmatriceOptions}
            selected={filters.confirmatrices}
            onChange={(selected) => 
              onFiltersChange({ ...filters, confirmatrices: selected })
            }
            placeholder="Sélectionner des confirmatrices"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Articles</label>
          <MultiSelect
            options={articleOptions}
            selected={filters.articles}
            onChange={(selected) => 
              onFiltersChange({ ...filters, articles: selected })
            }
            placeholder="Sélectionner des articles"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters}>
          Appliquer les filtres
        </Button>
        <Button variant="outline" onClick={handleResetFilters}>
          Réinitialiser
        </Button>
      </div>
    </div>
  )
}
