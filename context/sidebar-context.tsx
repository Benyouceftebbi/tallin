"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  close: () => void
  open: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  close: () => {},
  open: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  // Initialize state from localStorage when component mounts (client-side only)
  useEffect(() => {
    const storedState = localStorage.getItem("sidebarOpen")
    if (storedState !== null) {
      setIsOpen(storedState === "true")
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebarOpen", isOpen.toString())
  }, [isOpen])

  const toggle = () => setIsOpen((prev) => !prev)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return <SidebarContext.Provider value={{ isOpen, toggle, close, open }}>{children}</SidebarContext.Provider>
}

export const useSidebar = () => useContext(SidebarContext)
