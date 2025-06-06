import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar, MobileSidebar, SidebarToggle } from "@/components/sidebar"
import { ShopProvider } from "@/context/shop-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/context/sidebar-context"
import { AppProvider } from "@/context/app-context"
import { AuthProvider } from "@/context/auth-context"

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
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <AuthProvider>
{children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
