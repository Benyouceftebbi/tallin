"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function useOrderSearchParams() {
  const searchParams = useSearchParams()
  const [searchFilters, setSearchFilters] = useState({
    searchId: "",
    searchName: "",
    searchPhone: "",
    searchTrackingId: "",
    highlightOrder: "",
  })

  useEffect(() => {
    const filters = {
      searchId: searchParams.get("searchId") || "",
      searchName: searchParams.get("searchName") || "",
      searchPhone: searchParams.get("searchPhone") || "",
      searchTrackingId: searchParams.get("searchTrackingId") || "",
      highlightOrder: searchParams.get("highlightOrder") || "",
    }

    setSearchFilters(filters)
  }, [searchParams])

  return searchFilters
}
