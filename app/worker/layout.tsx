import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { Sidebar, MobileSidebar, SidebarToggle } from "@/components/sidebar"
import { ShopProvider } from "@/context/shop-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/context/sidebar-context"
import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"
import { WorkerSidebar } from "@/components/worker-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CRM E-commerce",
  description: "Système de gestion de commandes pour e-commerce",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-900 text-slate-50`}>
        <AppProvider>
          <ShopProvider>
            <SidebarProvider>
              <div className="flex h-screen">
                <WorkerSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="border-b border-slate-800 bg-slate-950">
                    <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
                      <MobileSidebar />
                      <SidebarToggle />
                    </div>
                  </header>
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
                </div>
              </div>
            </SidebarProvider>
          </ShopProvider>
          </AppProvider>

      </body>
    </html>
  )
}
