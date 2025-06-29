"use client"

import { LandingPageForm } from "@/components/landing-page-form"
import { useLandingPages } from "@/context/landing-pages-context"
import { useState } from "react"

export default function CreateLandingPage() {
  const { products, addLandingPage } = useLandingPages()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (data: any) => {
    setIsSaving(true)
    await addLandingPage(data)
    setIsSaving(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-background border-b p-4">
        <h1 className="text-xl font-semibold">Create New Landing Page</h1>
        <p className="text-sm text-muted-foreground">
          Fill out the details below to generate a new product landing page.
        </p>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <LandingPageForm products={products} onSave={handleSave} isSaving={isSaving} />
      </main>
    </div>
  )
}
