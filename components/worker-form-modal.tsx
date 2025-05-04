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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

// Define worker types
export type WorkerRole = "Confirmatrice" | "Préparateur" | "Dispatcher" | "Livreur"
export type PaymentMethod = "Par commande" | "Par article" | "Confirmation uniquement" | "Tarif fixe" | "Tarif horaire"
export type Region = "Alger" | "Oran" | "Constantine" | "Annaba" | "Blida" | "Tlemcen" | "Sétif"
export type WorkerStatus = "Actif" | "En congé" | "Inactif"

// Update the paymentRate type to include commission fields
export type Worker = {
  id: number
  name: string
  role: WorkerRole
  email: string
  phone: string
  status: WorkerStatus
  region: Region
  paymentMethod: PaymentMethod
  paymentRate: {
    perDelivery?: number
    perReturn?: number
    perConfirmation?: number
    perDispatch?: number
    perArticle?: number
    confirmationOnly?: number
    fixedRate?: number
    hourlyRate?: number
    commission?: {
      type: "fixed" | "percentage"
      value: number
    }
  }
  parcelsDelivered: number
  avatar?: string
  dateHired?: string
}

// Props for the worker form
type WorkerFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  worker?: Worker
  onSubmit: (worker: Omit<Worker, "id" | "parcelsDelivered">) => void
}

export function WorkerFormModal({ open, onOpenChange, worker, onSubmit }: WorkerFormModalProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState<Omit<Worker, "id" | "parcelsDelivered">>({
    name: worker?.name || "",
    role: worker?.role || "Confirmatrice",
    email: worker?.email || "",
    phone: worker?.phone || "",
    status: worker?.status || "Actif",
    region: worker?.region || "Alger",
    paymentMethod: worker?.paymentMethod || "Par commande",
    paymentRate: worker?.paymentRate || {},
    dateHired: worker?.dateHired || new Date().toISOString().split("T")[0],
    avatar: worker?.avatar || "",
  })

  const handleChange = (field: string, value: string | number | object) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePaymentRateChange = (field: string, value: number | object) => {
    setFormData((prev) => ({
      ...prev,
      paymentRate: {
        ...prev.paymentRate,
        [field]: value,
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      })
      return
    }

    onSubmit(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{worker ? "Modifier un travailleur" : "Ajouter un nouveau travailleur"}</DialogTitle>
          <DialogDescription>
            {worker
              ? "Modifiez les informations du travailleur ci-dessous."
              : "Remplissez les informations pour ajouter un nouveau travailleur."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="info">Informations générales</TabsTrigger>
              <TabsTrigger value="payment">Configuration de paiement</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Nom et prénom"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">
                    Rôle <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange("role", value as WorkerRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Confirmatrice">Confirmatrice</SelectItem>
                      <SelectItem value="Préparateur">Préparateur</SelectItem>
                      <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                      <SelectItem value="Livreur">Livreur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Téléphone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+213 XX XX XX XX"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Select value={formData.region} onValueChange={(value) => handleChange("region", value as Region)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alger">Alger</SelectItem>
                      <SelectItem value="Oran">Oran</SelectItem>
                      <SelectItem value="Constantine">Constantine</SelectItem>
                      <SelectItem value="Annaba">Annaba</SelectItem>
                      <SelectItem value="Blida">Blida</SelectItem>
                      <SelectItem value="Tlemcen">Tlemcen</SelectItem>
                      <SelectItem value="Sétif">Sétif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value as WorkerStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="En congé">En congé</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateHired">Date d'embauche</Label>
                  <Input
                    id="dateHired"
                    type="date"
                    value={formData.dateHired}
                    onChange={(e) => handleChange("dateHired", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleChange("paymentMethod", value as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Par commande">Par commande</SelectItem>
                    <SelectItem value="Par article">Par article</SelectItem>
                    <SelectItem value="Confirmation uniquement">Confirmation uniquement</SelectItem>
                    <SelectItem value="Tarif fixe">Tarif fixe</SelectItem>
                    <SelectItem value="Tarif horaire">Tarif horaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment configuration based on role and method */}
              <div className="space-y-4 border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium">Tarifs</h3>

                {formData.role === "Confirmatrice" && (
                  <div className="space-y-4">
                    {formData.paymentMethod === "Confirmation uniquement" && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmationOnly">Tarif par confirmation (DA)</Label>
                        <Input
                          id="confirmationOnly"
                          type="number"
                          step="10"
                          min="0"
                          value={formData.paymentRate.confirmationOnly || ""}
                          onChange={(e) => handlePaymentRateChange("confirmationOnly", Number(e.target.value))}
                          placeholder="Ex: 50"
                        />
                      </div>
                    )}

                    {formData.paymentMethod === "Par commande" && (
                      <div className="space-y-2">
                        <Label htmlFor="perConfirmation">Tarif par commande (DA)</Label>
                        <Input
                          id="perConfirmation"
                          type="number"
                          step="10"
                          min="0"
                          value={formData.paymentRate.perConfirmation || ""}
                          onChange={(e) => handlePaymentRateChange("perConfirmation", Number(e.target.value))}
                          placeholder="Ex: 100"
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.role === "Préparateur" && (
                  <div className="space-y-4">
                    {formData.paymentMethod === "Par article" && (
                      <div className="space-y-2">
                        <Label htmlFor="perArticle">Tarif par article (DA)</Label>
                        <Input
                          id="perArticle"
                          type="number"
                          step="10"
                          min="0"
                          value={formData.paymentRate.perArticle || ""}
                          onChange={(e) => handlePaymentRateChange("perArticle", Number(e.target.value))}
                          placeholder="Ex: 30"
                        />
                      </div>
                    )}

                    {formData.paymentMethod === "Par commande" && (
                      <div className="space-y-2">
                        <Label htmlFor="perConfirmation">Tarif par commande préparée (DA)</Label>
                        <Input
                          id="perConfirmation"
                          type="number"
                          step="10"
                          min="0"
                          value={formData.paymentRate.perConfirmation || ""}
                          onChange={(e) => handlePaymentRateChange("perConfirmation", Number(e.target.value))}
                          placeholder="Ex: 100"
                        />
                      </div>
                    )}
                  </div>
                )}

                {formData.role === "Livreur" && (
                  <div className="space-y-4 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="perDelivery">Tarif par livraison (DA)</Label>
                      <Input
                        id="perDelivery"
                        type="number"
                        step="10"
                        min="0"
                        value={formData.paymentRate.perDelivery || ""}
                        onChange={(e) => handlePaymentRateChange("perDelivery", Number(e.target.value))}
                        placeholder="Ex: 200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="perReturn">Tarif par retour (DA)</Label>
                      <Input
                        id="perReturn"
                        type="number"
                        step="10"
                        min="0"
                        value={formData.paymentRate.perReturn || ""}
                        onChange={(e) => handlePaymentRateChange("perReturn", Number(e.target.value))}
                        placeholder="Ex: 50"
                      />
                    </div>
                  </div>
                )}

                {formData.role === "Dispatcher" && (
                  <div className="space-y-2">
                    <Label htmlFor="perDispatch">Tarif par dispatch (DA)</Label>
                    <Input
                      id="perDispatch"
                      type="number"
                      step="10"
                      min="0"
                      value={formData.paymentRate.perDispatch || ""}
                      onChange={(e) => handlePaymentRateChange("perDispatch", Number(e.target.value))}
                      placeholder="Ex: 50"
                    />
                  </div>
                )}

                {(formData.paymentMethod === "Tarif fixe" || formData.paymentMethod === "Tarif horaire") && (
                  <div className="space-y-4 grid grid-cols-2 gap-4">
                    {formData.paymentMethod === "Tarif fixe" && (
                      <div className="space-y-2">
                        <Label htmlFor="fixedRate">Salaire fixe (DA)</Label>
                        <Input
                          id="fixedRate"
                          type="number"
                          step="1000"
                          min="0"
                          value={formData.paymentRate.fixedRate || ""}
                          onChange={(e) => handlePaymentRateChange("fixedRate", Number(e.target.value))}
                          placeholder="Ex: 40000"
                        />
                      </div>
                    )}

                    {formData.paymentMethod === "Tarif horaire" && (
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Taux horaire (DA)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="10"
                          min="0"
                          value={formData.paymentRate.hourlyRate || ""}
                          onChange={(e) => handlePaymentRateChange("hourlyRate", Number(e.target.value))}
                          placeholder="Ex: 350"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add this after the existing payment rate fields in the payment tab */}
              <div className="space-y-4 border rounded-md p-4 bg-gray-50 mt-4">
                <h3 className="font-medium">Commission</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionType">Type de commission</Label>
                    <Select
                      value={formData.paymentRate.commission?.type || "fixed"}
                      onValueChange={(value) => {
                        handlePaymentRateChange("commission", {
                          type: value,
                          value: formData.paymentRate.commission?.value || 0,
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Montant fixe</SelectItem>
                        <SelectItem value="percentage">Pourcentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionValue">
                      {formData.paymentRate.commission?.type === "percentage" ? "Pourcentage (%)" : "Montant (DA)"}
                    </Label>
                    <Input
                      id="commissionValue"
                      type="number"
                      step={formData.paymentRate.commission?.type === "percentage" ? "0.1" : "10"}
                      min="0"
                      max={formData.paymentRate.commission?.type === "percentage" ? "100" : undefined}
                      value={formData.paymentRate.commission?.value || ""}
                      onChange={(e) => {
                        handlePaymentRateChange("commission", {
                          type: formData.paymentRate.commission?.type || "fixed",
                          value: Number(e.target.value),
                        })
                      }}
                      placeholder={formData.paymentRate.commission?.type === "percentage" ? "Ex: 5" : "Ex: 500"}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="performanceBonus"
                  checked={formData.paymentRate.performanceBonus !== undefined}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handlePaymentRateChange("performanceBonus", 0)
                    } else {
                      const updatedPaymentRate = { ...formData.paymentRate }
                      delete updatedPaymentRate.performanceBonus
                      setFormData((prev) => ({
                        ...prev,
                        paymentRate: updatedPaymentRate,
                      }))
                    }
                  }}
                />
                <Label htmlFor="performanceBonus">Activer les bonus de performance</Label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{worker ? "Mettre à jour" : "Ajouter le travailleur"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
