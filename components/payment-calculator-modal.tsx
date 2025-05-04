"use client"

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

type PaymentRate = {
  perDelivery?: number
  perReturn?: number
  perConfirmation?: number
  perDispatch?: number
  commission?: {
    type: "percentage" | "fixed"
    value: number
  }
}

type WorkerPerformance = {
  ordersAssigned?: number
  ordersDelivered?: number
  ordersReturned?: number
  ordersConfirmed?: number
  ordersDispatched?: number
}

type PaymentCalculatorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  worker: {
    id: number
    name: string
    role: string
    paymentRate: PaymentRate
  } & WorkerPerformance
}

export function PaymentCalculatorModal({ open, onOpenChange, worker }: PaymentCalculatorProps) {
  const [rates, setRates] = useState<PaymentRate>(worker.paymentRate)

  const calculatePayment = () => {
    let total = 0

    if (worker.role === "Livreur" && rates.perDelivery && rates.perReturn) {
      const deliveryAmount = (worker.ordersDelivered || 0) * rates.perDelivery
      const returnAmount = (worker.ordersReturned || 0) * rates.perReturn
      total = deliveryAmount + returnAmount
    } else if (worker.role === "Préparateur" && rates.perConfirmation) {
      total = (worker.ordersConfirmed || 0) * rates.perConfirmation
    } else if (worker.role === "Dispatcher" && rates.perDispatch) {
      total = (worker.ordersDispatched || 0) * rates.perDispatch
    }

    return total
  }

  const totalRevenue =
    (worker.ordersDelivered || 0) * (rates.perDelivery || 0) + (worker.ordersReturned || 0) * (rates.perReturn || 0)
  const basePayment = calculatePayment()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Calcul de paiement</DialogTitle>
          <DialogDescription>Détails du calcul de paiement pour {worker.name}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input id="name" value={worker.name} readOnly className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="role" className="text-right">
                Rôle
              </Label>
              <Input id="role" value={worker.role} readOnly className="bg-muted" />
            </div>
          </div>

          {worker.role === "Livreur" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivered" className="text-right">
                    Colis livrés
                  </Label>
                  <Input id="delivered" value={worker.ordersDelivered} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="returned" className="text-right">
                    Colis retournés
                  </Label>
                  <Input id="returned" value={worker.ordersReturned} readOnly className="bg-muted" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rate-delivery" className="text-right">
                    Taux par livraison (€)
                  </Label>
                  <Input
                    id="rate-delivery"
                    type="number"
                    step="0.1"
                    value={rates.perDelivery}
                    onChange={(e) => setRates({ ...rates, perDelivery: Number.parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="rate-return" className="text-right">
                    Taux par retour (€)
                  </Label>
                  <Input
                    id="rate-return"
                    type="number"
                    step="0.1"
                    value={rates.perReturn}
                    onChange={(e) => setRates({ ...rates, perReturn: Number.parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {worker.role === "Préparateur" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="confirmed" className="text-right">
                    Colis confirmés
                  </Label>
                  <Input id="confirmed" value={worker.ordersConfirmed} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="returned-prep" className="text-right">
                    Colis retournés
                  </Label>
                  <Input id="returned-prep" value={worker.ordersReturned} readOnly className="bg-muted" />
                </div>
              </div>
              <div>
                <Label htmlFor="rate-confirmation" className="text-right">
                  Taux par confirmation (€)
                </Label>
                <Input
                  id="rate-confirmation"
                  type="number"
                  step="0.1"
                  value={rates.perConfirmation}
                  onChange={(e) => setRates({ ...rates, perConfirmation: Number.parseFloat(e.target.value) })}
                />
              </div>
            </>
          )}

          {worker.role === "Dispatcher" && (
            <>
              <div>
                <Label htmlFor="dispatched" className="text-right">
                  Colis dispatché
                </Label>
                <Input id="dispatched" value={worker.ordersDispatched} readOnly className="bg-muted" />
              </div>
              <div>
                <Label htmlFor="rate-dispatch" className="text-right">
                  Taux par dispatch (€)
                </Label>
                <Input
                  id="rate-dispatch"
                  type="number"
                  step="0.1"
                  value={rates.perDispatch}
                  onChange={(e) => setRates({ ...rates, perDispatch: Number.parseFloat(e.target.value) })}
                />
              </div>
            </>
          )}

          <div className="space-y-4 border rounded-md p-4 bg-slate-800/50 mt-4">
            <h3 className="font-medium text-slate-100">Commission</h3>

            {worker.paymentRate.commission ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-slate-100">
                    {worker.paymentRate.commission.type === "percentage" ? "Pourcentage" : "Montant fixe"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valeur:</span>
                  <span className="text-slate-100">
                    {worker.paymentRate.commission.type === "percentage"
                      ? `${worker.paymentRate.commission.value}%`
                      : `${worker.paymentRate.commission.value} DA`}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Commission estimée:</span>
                  <span className="text-slate-100">
                    {worker.paymentRate.commission.type === "percentage"
                      ? `${((totalRevenue * worker.paymentRate.commission.value) / 100).toFixed(2)} DA`
                      : `${worker.paymentRate.commission.value} DA`}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Aucune commission configurée pour ce travailleur.</p>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg">Total à payer:</Label>
              <div className="text-xl font-bold">€{basePayment.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-700">
            <span className="text-slate-400">Total estimé:</span>
            <span className="text-xl font-bold text-slate-100">
              {(
                basePayment +
                (worker.paymentRate.commission
                  ? worker.paymentRate.commission.type === "percentage"
                    ? (totalRevenue * worker.paymentRate.commission.value) / 100
                    : worker.paymentRate.commission.value
                  : 0)
              ).toFixed(2)}{" "}
              DA
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Confirmer le paiement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
