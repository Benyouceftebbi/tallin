"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

interface AuthCheckProps {
  children: React.ReactNode
  allowedRole: "worker" | "admin" | "any"
}

export function AuthCheck({ children, allowedRole }: AuthCheckProps) {
  const { user, userRole, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
      return
    }

    if (!isLoading && user && userRole) {
      if (allowedRole === "any") {
         router.push("/admin")
        return
      }

      if (allowedRole === "worker" && userRole !== "worker") {
        router.push("/admin")
        return
      }

      if (allowedRole === "admin" && userRole !== "admin") {
        router.push("/worker")
        return
      }
    }
  }, [user, userRole, isLoading, router, allowedRole])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
