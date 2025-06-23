"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Clock,
  CheckCircle,
  Box,
  ClipboardCheck,
  Truck,
  PackageCheck,
  PackageX,
  Users,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ShoppingCart,
  Package,
  FileText,
  BarChart2,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "@/context/sidebar-context"
import { useAuth } from "@/context/auth-context"

const sidebarLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Commandes",
    icon: Box,
    href: "/admin/commandes",
    submenu: [
      {
        title: "En attente",
        icon: Clock,
        href: "/admin/commandes/en-attente",
        color: "text-amber-700",
      },
      {
        title: "Confirmés",
        icon: CheckCircle,
        href: "/admin/commandes/confirmes",
        color: "text-emerald-700",
      },
      {
        title: "En préparation",
        icon: Box,
        href: "/admin/commandes/en-preparation",
        color: "text-blue-700",
      },
      {
        title: "Dispatcher",
        icon: ClipboardCheck,
        href: "/admin/commandes/dispatcher",
        color: "text-purple-700",
      },
      {
        title: "En livraison",
        icon: Truck,
        href: "/admin/commandes/en-livraison",
        color: "text-orange-700",
      },
      {
        title: "Livrés",
        icon: PackageCheck,
        href: "/admin/commandes/livres",
        color: "text-cyan-700",
      },
      {
        title: "Retour",
        icon: PackageX,
        href: "/admin/commandes/retour",
        color: "text-rose-700",
      },
       {
             title: "Reporté",
            href: "/admin/commandes/reporte",
            icon: Clock,
            color: "text-rose-500",
           
          },
               {
             title: "Repture",
            href: "/admin/commandes/repture",
            icon: Clock,
            color: "text-rose-500",
           
          },
      {
        title: "Annule",
        icon: PackageX,
        href: "/admin/commandes/annule",
        color: "text-rose-700",
      },
    ],
  },

  {
    title: "Stock",
    icon: ShoppingCart,
    href: "/stock",
    submenu: [
      {
        title: "Produits",
        icon: Package,
        href: "/admin/stock/products",
        color: "text-violet-500",
      },
      {
        title: "Mouvement",
        icon: Box,
        href: "/admin/stock/movement",
        color: "text-pink-700",
      },
      {
        title: "Factures",
        icon: FileText,
        href: "/admin/stock/invoices",
        color: "text-emerald-500",
      },
      {
        title: "Statistiques",
        icon: BarChart2,
        href: "/admin/stock/statistics",
        color: "text-amber-500",
      },
    ],
  }, 
  {
    title: "Travailleurs",
    icon: Users,
    href: "/admin/travailleurs",
  },
  {
    title: "Facturation",
    icon: CreditCard,
    href: "/admin/facturation",
  },
  {
    title: "Paramètres",
    icon: Settings,
    href: "/admin/parametres",
  },
]
const workersidebarLinks =  [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/worker",
  },
  {
    title: "Commandes",
    icon: Box,
    href: "/worker/commandes",
    submenu: [
      {
        title: "En attente",
        icon: Clock,
        href: "/worker/commandes/en-attente",
        color: "text-amber-700",
      },
      {
        title: "Confirmés",
        icon: CheckCircle,
        href: "/worker/commandes/confirmes",
        color: "text-emerald-700",
      },
      {
        title: "En préparation",
        icon: Box,
        href: "/worker/commandes/en-preparation",
        color: "text-blue-700",
      },
      {
        title: "Dispatcher",
        icon: ClipboardCheck,
        href: "/worker/commandes/dispatcher",
        color: "text-purple-700",
      },
      {
        title: "En livraison",
        icon: Truck,
        href: "/worker/commandes/en-livraison",
        color: "text-orange-700",
      },
      {
        title: "Livrés",
        icon: PackageCheck,
        href: "/worker/commandes/livres",
        color: "text-cyan-700",
      },
      {
        title: "Retour",
        icon: PackageX,
        href: "/worker/commandes/retour",
        color: "text-rose-700",
      },
             {
             title: "Reporté",
            href: "/worker/commandes/reporte",
            icon: Clock,
            color: "text-rose-500",
           
          },
      {
        title: "Annule",
        icon: PackageX,
        href: "/worker/commandes/annule",
        color: "text-rose-700",
      },
    ],
  },

]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState("Commandes")
  const { isOpen } = useSidebar()
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const submenuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? "" : title)
  }

  const handleMouseEnter = (title: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredSubmenu(title)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSubmenu(null)
    }, 300)
  }

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hoveredSubmenu &&
        submenuRefs.current[hoveredSubmenu] &&
        !submenuRefs.current[hoveredSubmenu]?.contains(event.target as Node)
      ) {
        setHoveredSubmenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [hoveredSubmenu])

  // Check if current path is in a submenu
  const isInSubmenu = (link: (typeof sidebarLinks)[0]) => {
    if (!link.submenu) return false
    return link.submenu.some((sublink) => pathname.startsWith(sublink.href))
  }
  const { userRole ,user} = useAuth()

  return (
    <div className={cn("hidden lg:block", className)}>
      <div
        className={cn(
          "h-screen border-r border-slate-800 bg-slate-950 transition-all duration-300",
          isOpen ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-14 items-center border-b border-slate-800 px-4">
          {isOpen ? (
            <Link href="/" className="flex items-center gap-2">
              <Box className="h-6 w-6 text-emerald-500" />
              <span className="text-lg font-bold text-white">CRM E-commerce</span>
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center w-full">
              <Box className="h-6 w-6 text-emerald-500" />
            </Link>
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className={cn("py-2", isOpen ? "px-3" : "px-2")}>
            <TooltipProvider delayDuration={0}>
              <nav className="flex flex-col gap-1">
      {(user?.uid === 'kWTBGC7Wf4OfDq1cpFIYz0uE3Ft2' ? sidebarLinks : workersidebarLinks).map((link) => (
                  <div key={link.title}>
                    {link.submenu && isOpen ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => toggleSubmenu(link.title)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                            openSubmenu === link.title || pathname === link.href || isInSubmenu(link)
                              ? "bg-slate-800 text-white"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <link.icon className="h-4 w-4" />
                            <span>{link.title}</span>
                          </div>
                          {openSubmenu === link.title ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {openSubmenu === link.title && (
                          <div className="ml-4 space-y-1 pl-4 border-l border-slate-800">
                            {link.submenu.map((sublink) => (
                               <Link
                               key={sublink.href}
                               href={sublink.href}
                               className={cn(
                                 `text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:${sublink.color} hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition`,
                                 pathname === sublink.href ? `${sublink.color} bg-slate-100 dark:bg-slate-800` : "text-muted-foreground",
                               )}
                             >
                               <div className="flex items-center flex-1">
                                 <sublink.icon className={cn("h-4 w-4 mr-3", sublink.color)} />
                                 {sublink.title}
                               </div>
                             </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : link.submenu && !isOpen ? (
                      <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter(link.title)}
                        onMouseLeave={handleMouseLeave}
                        ref={(el) => (submenuRefs.current[link.title] = el)}
                      >
                        <Link
                          href={link.href}
                          className={cn(
                            "flex w-full items-center justify-center rounded-md p-2 text-sm font-medium",
                            pathname.startsWith("/commandes")
                              ? "bg-emerald-900/50 text-emerald-400"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white",
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                        </Link>
                        {hoveredSubmenu === link.title && (
                          <div className="absolute left-full top-0 z-50 ml-2 w-48 rounded-md border border-slate-800 bg-slate-950 py-1 shadow-lg">
                            {link.submenu.map((sublink) => (
                              <Link
                                key={sublink.title}
                                href={sublink.href}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2 text-sm",
                                  pathname === sublink.href
                                    ? "bg-emerald-900/50 text-emerald-400"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                )}
                              >
                                <sublink.icon className="h-4 w-4" />
                                <span>{sublink.title}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : isOpen ? (
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                          pathname === link.href
                            ? "bg-emerald-900/50 text-emerald-400"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                        )}
                      >
                        <link.icon className="h-4 w-4" />
                        <span>{link.title}</span>
                      </Link>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={link.href}
                            className={cn(
                              "flex items-center justify-center rounded-md p-2 text-sm font-medium",
                              pathname === link.href
                                ? "bg-emerald-900/50 text-emerald-400"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white",
                            )}
                          >
                            <link.icon className="h-5 w-5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{link.title}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </nav>
            </TooltipProvider>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState("Commandes")
  const {userRole,user} = useAuth()
  console.log("Usersss role:", userRole);
  
  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? "" : title)
  }

  // Check if current path is in a submenu
  const isInSubmenu = (link: (typeof sidebarLinks)[0]) => {
    if (!link.submenu) return false
    return link.submenu.some((sublink) => pathname.startsWith(sublink.href))
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-slate-950 border-r border-slate-800">
        <div className="flex h-14 items-center border-b border-slate-800 px-6">
          <Link href="/" className="flex items-center gap-2">
            <Box className="h-6 w-6 text-emerald-500" />
            <span className="text-lg font-bold text-white">CRM E-commerce</span>
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-3.5rem)]">
          <div className="px-3 py-2">
            <nav className="flex flex-col gap-1">
            {(user?.uid === 'kWTBGC7Wf4OfDq1cpFIYz0uE3Ft2'  ? sidebarLinks : workersidebarLinks).map((link) => (
                <div key={link.title}>
                  {link.submenu ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(link.title)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                          openSubmenu === link.title || pathname === link.href || isInSubmenu(link)
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className="h-4 w-4" />
                          <span>{link.title}</span>
                        </div>
                        {openSubmenu === link.title ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {openSubmenu === link.title && (
                        <div className="ml-4 space-y-1 pl-4 border-l border-slate-800">
                          {link.submenu.map((sublink) => (
                            <Link
                              key={sublink.title}
                              href={sublink.href}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                                pathname === sublink.href
                                  ? "bg-emerald-900/50 text-emerald-400"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                              )}
                            >
                              <sublink.icon className="h-4 w-4" />
                              <span>{sublink.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                        pathname === link.href
                          ? "bg-emerald-900/50 text-emerald-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white",
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      <span>{link.title}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function SidebarToggle() {
  const { isOpen, toggle } = useSidebar();
const { logout,user} = useAuth();


  return (
    <div className="hidden lg:flex items-center justify-between w-full px-4">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeft className="h-5 w-5" />
        )}
      </Button>

  <div className="flex items-center gap-3">
      {/* User email display */}
      <span className="text-xs text-muted-foreground">{user?.email}</span>

      {/* Logout button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        aria-label="Logout"
      >
        <LogOut className="h-5 w-5 text-red-500" />
      </Button>
    </div>
    </div>
  );
}