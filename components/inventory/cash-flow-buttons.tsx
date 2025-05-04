"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TrendingDown, TrendingUp } from "lucide-react"
import { CashTransactionModal } from "./cash-transaction-modal"

export function CashFlowButtons() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<"inflow" | "outflow">("inflow")

  const openInflowModal = () => {
    setTransactionType("inflow")
    setIsModalOpen(true)
  }

  const openOutflowModal = () => {
    setTransactionType("outflow")
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
          onClick={openInflowModal}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Encaissement
        </Button>
        <Button
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
          onClick={openOutflowModal}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Décaissement
        </Button>
      </div>

      <CashTransactionModal open={isModalOpen} onOpenChange={setIsModalOpen} defaultType={transactionType} />
    </>
  )
}
