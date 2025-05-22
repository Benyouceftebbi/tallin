"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"

type UserRole = "admin" | "worker" | null

interface AuthContextType {
  user: User | null
  userRole: UserRole
  isLoading: boolean
  getUserRole: () => Promise<UserRole>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  getUserRole: async () => null,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Fetch user role from Firestore
  const getUserRole = async (): Promise<UserRole> => {
    if (!user) return null

    try {
      // Get the ID token result which contains custom claims
      const idTokenResult = await user.getIdTokenResult(true)

      // Get the role from custom claims
      const role = idTokenResult.claims.role as UserRole
      setUserRole(role)
      return role
    } catch (error) {
      console.error("Error fetching user role from claims:", error)
      return null
    }
  }

  // Handle logout
  const logout = async () => {
    try {
      await signOut(auth)
      router.push("/sign-in")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }
const [workerName, setWorkerName] = useState<string | null>(null);
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
          const role = await getUserRole(); // should set userRole internally
        await getUserRole()
          if (role === "worker") {
        const workerSnap = await getDoc(doc(db, "Workers", currentUser.uid));
        if (workerSnap.exists()) {
          const workerData = workerSnap.data();
          setWorkerName(workerData.name); // save this in a useState
        }
      }
      } else {
        setUserRole(null)

        // Redirect to sign-in if accessing protected routes
        if (pathname !== "/sign-in" && !pathname.startsWith("/_next")) {
          router.push("/sign-in")
        }
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [pathname])

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, getUserRole, logout,workerName }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
