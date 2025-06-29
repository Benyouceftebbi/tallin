"use client"

import { LandingPageForm } from "@/components/landing-page-form"
import { useLandingPages } from "@/context/landing-pages-context"
import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function EditLandingPage() {
  const { id } = useParams()
  const { landingPages, products, updateLandingPage, loading } = useLandingPages()
  const [isSaving, setIsSaving] = useState(false)

  const pageData = useMemo(() => {
    return landingPages.find((p) => p.id === id)
  }, [id, landingPages])

  const handleSave = async (data: any) => {
    if (!id || typeof id !== "string") return
    setIsSaving(true)
    await updateLandingPage(id, data)
    setIsSaving(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!pageData) {
    return <div className="flex-1 flex items-center justify-center">Landing page not found.</div>
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-background border-b p-4">
        <h1 className="text-xl font-semibold">Edit Landing Page</h1>
        <p className="text-sm text-muted-foreground">
          Update the details for your landing page: {pageData.productTitle}
        </p>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <LandingPageForm products={products} onSave={handleSave} isSaving={isSaving} initialData={pageData} />
      </main>
    </div>
  )
}
