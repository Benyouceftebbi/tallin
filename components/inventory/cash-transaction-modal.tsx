"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface CashTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: "inflow" | "outflow"
}

export function CashTransactionModal({ open, onOpenChange, defaultType = "inflow" }: CashTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<"inflow" | "outflow">(defaultType)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [reference, setReference] = useState("")
  const [counterparty, setCounterparty] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!amount || !description || !paymentMethod) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    // In a real app, you would save the transaction data here
    toast({
      title: "Transaction enregistrée",
      description: `${transactionType === "inflow" ? "Encaissement" : "Décaissement"} de ${amount} € a été enregistré.`,
    })

    // Reset form and close modal
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setAmount("")
    setDescription("")
    setPaymentMethod("")
    setReference("")
    setCounterparty("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enregistrer une transaction</DialogTitle>
            <DialogDescription>
              Entrez les détails de la transaction. Cliquez sur enregistrer lorsque vous avez terminé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="transaction-type">Type de transaction</Label>
              <RadioGroup
                id="transaction-type"
                value={transactionType}
                onValueChange={(value) => setTransactionType(value as "inflow" | "outflow")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inflow" id="inflow" />
                  <Label htmlFor="inflow" className="text-green-600">
                    Encaissement
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outflow" id="outflow" />
                  <Label htmlFor="outflow" className="text-red-600">
                    Décaissement
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Montant (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Entrez la description de la transaction"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-method">Moyen de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Sélectionnez un moyen de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Carte bancaire</SelectItem>
                  <SelectItem value="bank-transfer">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="apple-pay">Apple Pay</SelectItem>
                  <SelectItem value="google-pay">Google Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Numéro de référence</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° de commande, N° de facture, etc."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="counterparty">
                {transactionType === "inflow" ? "Client" : "Fournisseur/Destinataire"}
              </Label>
              <Input
                id="counterparty"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder={transactionType === "inflow" ? "Nom du client" : "Nom du fournisseur/destinataire"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
