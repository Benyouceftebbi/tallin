"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useShop, type Worker, type WorkerRole } from "@/context/shop-context"

const roles = [
  { label: "Livreur", value: "Livreur" },
  { label: "Confirmatrice", value: "Confirmatrice" },
  { label: "Préparateur", value: "Préparateur" },
  { label: "Dispatcher", value: "Dispatcher" },
  { label: "Admin", value: "Admin" },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  phone: z.string().min(10, {
    message: "Le numéro de téléphone doit contenir au moins 10 caractères.",
  }),
  role: z.enum(["Livreur", "Confirmatrice", "Préparateur", "Dispatcher", "Admin"]),
  active: z.boolean().default(true),
  joinDate: z.date(),
  paymentType: z.enum(["fixed", "percentage"]),
  paymentAmount: z.coerce.number().min(1, {
    message: "Le montant doit être supérieur à 0.",
  }),
  hasCommission: z.boolean().default(false),
  commissionType: z.enum(["fixed", "percentage"]).optional(),
  commissionAmount: z.coerce.number().optional(),
  hasThreshold: z.boolean().default(false),
  thresholdValue: z.coerce.number().optional(),
  thresholdType: z.enum(["orders", "amount"]).optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface WorkerFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerId: string | null
}

export function WorkerFormModal({ open, onOpenChange, workerId }: WorkerFormModalProps) {
  const { workers, addWorker, updateWorker, getWorkerById } = useShop()
  const [activeTab, setActiveTab] = useState("general")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      role: "Livreur",
      active: true,
      joinDate: new Date(),
      paymentType: "fixed",
      paymentAmount: 100,
      hasCommission: false,
      hasThreshold: false,
    },
  })

  // Charger les données du travailleur si on est en mode édition
  useEffect(() => {
    if (workerId) {
      const worker = getWorkerById(workerId)
      if (worker) {
        form.reset({
          name: worker.name,
          phone: worker.phone,
          role: worker.role,
          active: worker.active,
          joinDate: new Date(worker.joinDate.split("/").reverse().join("-")),
          paymentType: worker.paymentStructure.type,
          paymentAmount: worker.paymentStructure.amount,
          hasCommission: !!worker.commission,
          commissionType: worker.commission?.type,
          commissionAmount: worker.commission?.amount,
          hasThreshold: !!(worker.commission?.threshold && worker.commission?.thresholdType),
          thresholdValue: worker.commission?.threshold,
          thresholdType: worker.commission?.thresholdType,
          notes: worker.notes || "",
        })
      }
    } else {
      form.reset({
        name: "",
        phone: "",
        role: "Livreur",
        active: true,
        joinDate: new Date(),
        paymentType: "fixed",
        paymentAmount: 100,
        hasCommission: false,
        hasThreshold: false,
        notes: "",
      })
    }
  }, [workerId, form, getWorkerById])

  function onSubmit(data: FormValues) {
    // Construire l'objet travailleur à partir des données du formulaire
    const workerData = {
      name: data.name,
      phone: data.phone,
      role: data.role as WorkerRole,
      active: data.active,
      joinDate: format(data.joinDate, "dd/MM/yyyy", { locale: fr }),
      paymentStructure: {
        type: data.paymentType,
        amount: data.paymentAmount,
      },
      notes: data.notes,
    } as Omit<Worker, "id">

    // Ajouter la commission si elle est activée
    if (data.hasCommission && data.commissionType && data.commissionAmount) {
      workerData.commission = {
        type: data.commissionType,
        amount: data.commissionAmount,
      }

      // Ajouter le seuil si activé
      if (data.hasThreshold && data.thresholdValue && data.thresholdType) {
        workerData.commission.threshold = data.thresholdValue
        workerData.commission.thresholdType = data.thresholdType
      }
    }

    // Mettre à jour ou ajouter le travailleur
    if (workerId) {
      updateWorker(workerId, workerData)
    } else {
      addWorker(workerData)
    }

    // Fermer le modal
    onOpenChange(false)
  }

  // Déterminer si les champs de commission doivent être affichés
  const showCommissionFields = form.watch("hasCommission")
  const showThresholdFields = form.watch("hasThreshold") && showCommissionFields

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workerId ? "Modifier le travailleur" : "Ajouter un travailleur"}</DialogTitle>
          <DialogDescription>
            {workerId
              ? "Modifiez les informations du travailleur ci-dessous."
              : "Remplissez les informations pour ajouter un nouveau travailleur."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Informations générales</TabsTrigger>
                <TabsTrigger value="payment">Paiement & Commission</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom du travailleur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="+213 XX XX XX XX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
                              {field.value
                                ? roles.find((role) => role.value === field.value)?.label
                                : "Sélectionner un rôle"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Rechercher un rôle..." />
                              <CommandList>
                                <CommandEmpty>Aucun rôle trouvé.</CommandEmpty>
                                <CommandGroup>
                                  {roles.map((role) => (
                                    <CommandItem
                                      key={role.value}
                                      value={role.value}
                                      onSelect={() => {
                                        form.setValue("role", role.value as WorkerRole)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === role.value ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      {role.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date d'embauche</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Statut actif</FormLabel>
                        <FormDescription>
                          Indiquez si ce travailleur est actuellement actif dans l'entreprise.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notes supplémentaires sur ce travailleur..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="payment" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Structure de paiement</h3>
                    <FormField
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Type de paiement</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="fixed" />
                                </FormControl>
                                <FormLabel className="font-normal">Montant fixe par commande</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="percentage" />
                                </FormControl>
                                <FormLabel className="font-normal">Pourcentage du montant</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentAmount"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>
                            {form.watch("paymentType") === "fixed" ? "Montant (DA)" : "Pourcentage (%)"}
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="hasCommission"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Commission</FormLabel>
                          <FormDescription>Activer la commission pour ce travailleur</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {showCommissionFields && (
                    <div className="rounded-lg border p-4 space-y-4">
                      <h3 className="font-medium mb-2">Structure de commission</h3>
                      <FormField
                        control={form.control}
                        name="commissionType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Type de commission</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="fixed" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Montant fixe</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="percentage" />
                                  </FormControl>
                                  <FormLabel className="font-normal">Pourcentage</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="commissionAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {form.watch("commissionType") === "fixed" ? "Montant (DA)" : "Pourcentage (%)"}
                            </FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hasThreshold"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Seuil de commission</FormLabel>
                              <FormDescription>
                                Définir un seuil à atteindre avant d'appliquer la commission
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {showThresholdFields && (
                        <>
                          <FormField
                            control={form.control}
                            name="thresholdValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valeur du seuil</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="thresholdType"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Type de seuil</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                  >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="orders" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Nombre de commandes</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="amount" />
                                      </FormControl>
                                      <FormLabel className="font-normal">Montant total (DA)</FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button type="submit">{workerId ? "Mettre à jour" : "Ajouter"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
