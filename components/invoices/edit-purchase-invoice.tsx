"use client"

import { useEffect, useState } from "react"
import { PurchaseInvoiceForm } from "./purchase-invoice-form"
import { useShop } from "@/context/shop-context"

interface EditInvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: any | null
  onClose: () => void
}

export function EditInvoiceForm({ open, onOpenChange, invoice, onClose }: EditInvoiceFormProps) {
  const { updateInvoice } = useShop()
  const [formData, setFormData] = useState<any>(null)

  // Prepare invoice data for the form when an invoice is selected for editing
  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        // Add any transformations needed for the form
      })
    } else {
      setFormData(null)
    }
  }, [invoice])

  // Handle form submission for updating the invoice
  const handleUpdateInvoice = async (updatedInvoice: any) => {
    if (invoice && invoice.id) {
      try {
        await updateInvoice({
          ...updatedInvoice,
          id: invoice.id,
        })
        onClose()
      } catch (error) {
        console.error("Failed to update invoice:", error)
      }
    }
  }

  return (
    <PurchaseInvoiceForm
      open={open}
      onOpenChange={onOpenChange}
      initialData={formData}
      isEditing={true}
      onSubmit={handleUpdateInvoice}
    />
  )
}
