"use client"

import * as React from "react"
import {
  addDays,
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export type DateRange = {
  from: Date
  to: Date
}

type PredefinedRange = {
  name: string
  label: string
  value: () => DateRange
}

const predefinedRanges: PredefinedRange[] = [
  {
    name: "today",
    label: "Today",
    value: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    name: "yesterday",
    label: "Yesterday",
    value: () => ({
      from: startOfDay(addDays(new Date(), -1)),
      to: endOfDay(addDays(new Date(), -1)),
    }),
  },
  {
    name: "last7days",
    label: "Last 7 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    name: "last14days",
    label: "Last 14 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -13)),
      to: endOfDay(new Date()),
    }),
  },
  {
    name: "last30days",
    label: "Last 30 days",
    value: () => ({
      from: startOfDay(addDays(new Date(), -29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    name: "thisWeek",
    label: "This Week",
    value: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
  },
  {
    name: "lastWeek",
    label: "Last Week",
    value: () => {
      const now = new Date()
      const startOfLastWeek = startOfWeek(addDays(now, -7), { weekStartsOn: 1 })
      const endOfLastWeek = endOfWeek(startOfLastWeek, { weekStartsOn: 1 })
      return {
        from: startOfLastWeek,
        to: endOfLastWeek,
      }
    },
  },
  {
    name: "thisMonth",
    label: "This Month",
    value: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    name: "lastMonth",
    label: "Last Month",
    value: () => {
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      return {
        from: startOfMonth(date),
        to: endOfMonth(date),
      }
    },
  },
]

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  align?: "start" | "center" | "end"
  className?: string
}

export function DateRangePicker({ dateRange, onDateRangeChange, align = "end", className }: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState<string>("")
  const [compareMode, setCompareMode] = React.useState(false)
  const [calendarDate, setCalendarDate] = React.useState<Date>(new Date())

  // Update the selected preset when date range changes externally
  React.useEffect(() => {
    if (!dateRange) {
      setSelectedPreset("")
      return
    }

    // Check if the current date range matches any predefined range
    const matchedRange = predefinedRanges.find((range) => {
      const { from, to } = range.value()
      return isSameDay(from, dateRange.from) && isSameDay(to, dateRange.to)
    })

    setSelectedPreset(matchedRange?.name || "")
  }, [dateRange])

  // Format the date range for display
  const formatDateRange = () => {
    if (!dateRange) return "Select date range"

    return format(dateRange.from, "MMM d, yyyy")
  }

  // Handle preset selection
  const handlePresetSelect = (preset: PredefinedRange) => {
    setSelectedPreset(preset.name)
    onDateRangeChange(preset.value())
    setIsCalendarOpen(false)
  }

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCalendarDate(subMonths(calendarDate, 1))
  }

  // Navigate to next month
  const handleNextMonth = () => {
    setCalendarDate(addMonths(calendarDate, 1))
  }

  // Custom day rendering for the calendar
  const renderDay = (day: Date, selectedDay: Date | undefined, dayProps: React.HTMLAttributes<HTMLDivElement>) => {
    // Make sure day is a valid date
    if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
      return <div {...dayProps}>{dayProps.children}</div>
    }

    // Check if the day is within the selected range
    const isSelected = dateRange && day >= dateRange.from && day <= dateRange.to

    // Check if the day is today
    const isToday = isSameDay(day, new Date())

    return (
      <div
        {...dayProps}
        className={cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md flex items-center justify-center",
          isSelected && "bg-slate-800 text-slate-50",
          isToday && !isSelected && "border border-slate-400",
          dayProps.className,
        )}
      >
        {format(day, "d")}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-between text-left font-normal h-9 px-3 bg-slate-800/50 border-slate-700",
              !dateRange && "text-slate-500",
            )}
          >
            <span>{formatDateRange()}</span>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align={align}>
          <div className="flex flex-col sm:flex-row p-4 gap-4 min-w-[560px]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compare-mode"
                    checked={compareMode}
                    onCheckedChange={setCompareMode}
                    className="data-[state=checked]:bg-cyan-600"
                  />
                  <Label htmlFor="compare-mode" className="text-sm text-slate-400">
                    Compare
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-slate-700"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous month</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-slate-700"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next month</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-center mb-2 text-slate-300">
                    {format(calendarDate, "MMMM yyyy")}
                  </div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        onDateRangeChange({
                          from: startOfDay(range.from),
                          to: endOfDay(range.to),
                        })
                        setSelectedPreset("")
                      }
                    }}
                    month={calendarDate}
                    className="border-0 p-0"
                    disabled={(date) => date > new Date()}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-center mb-2 text-slate-300">
                    {format(addMonths(calendarDate, 1), "MMMM yyyy")}
                  </div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        onDateRangeChange({
                          from: startOfDay(range.from),
                          to: endOfDay(range.to),
                        })
                        setSelectedPreset("")
                      }
                    }}
                    month={addMonths(calendarDate, 1)}
                    className="border-0 p-0"
                    disabled={(date) => date > new Date()}
                  />
                </div>
              </div>
            </div>

            <div className="w-48 border-l border-slate-800 pl-4 space-y-3">
              {predefinedRanges.map((preset) => (
                <Button
                  key={preset.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800",
                    selectedPreset === preset.name && "bg-slate-800 text-slate-100",
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end p-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalendarOpen(false)}
              className="mr-2 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCalendarOpen(false)}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
            >
              Update
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
