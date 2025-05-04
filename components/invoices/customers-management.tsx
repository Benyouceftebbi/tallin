"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus, Search, Trash, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppContext } from "@/context/app-context"

export type Customer = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
}

export const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Entreprise ABC",
    contact: "Marie Dupont",
    email: "contact@entreprise-abc.com",
    phone: "01 23 45 67 89",
    address: "123 Rue du Commerce, 75001 Paris",
  },
  {
    id: "cust-2",
    name: "Société XYZ",
    contact: "Pierre Martin",
    email: "info@societe-xyz.com",
    phone: "01 98 76 54 32",
    address: "45 Avenue des Affaires, 69002 Lyon",
  },
  {
    id: "cust-3",
    name: "Boutique Mode",
    contact: "Sophie Durand",
    email: "contact@boutique-mode.com",
    phone: "03 45 67 89 10",
    address: "78 Boulevard de la Mode, 75008 Paris",
  },
]

interface CustomersManagementProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectCustomer?: (customer: Customer) => void
  selectable?: boolean
}

export function CustomersManagement({
  open,
  onOpenChange,
  onSelectCustomer,
  selectable = false,
}: CustomersManagementProps) {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useAppContext()

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<Omit<Customer, "id">>({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
  })

  // Filtrer les clients en fonction de la recherche
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery),
  )

  // Gérer l'ajout d'un client
  const handleAddCustomer = () => {
    const id = `cust-${Date.now()}`
    addCustomer({ id, ...newCustomer })
    setNewCustomer({
      name: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
    })
    setIsAddDialogOpen(false)
  }

  // Gérer la modification d'un client
  const handleEditCustomer = () => {
    if (currentCustomer) {
      updateCustomer(currentCustomer.id, currentCustomer)
      setCurrentCustomer(null)
      setIsEditDialogOpen(false)
    }
  }

  // Gérer la suppression d'un client
  const handleDeleteCustomer = () => {
    if (currentCustomer) {
      deleteCustomer(currentCustomer.id)
      setCurrentCustomer(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Gérer la sélection d'un client
  const handleSelectCustomer = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer)
      onOpenChange(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gestion des clients</SheetTitle>
            <SheetDescription>Ajoutez, modifiez ou supprimez des clients.</SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des clients..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un client
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.contact}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentCustomer(customer)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentCustomer(customer)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                            {selectable && (
                              <Button variant="ghost" size="sm" onClick={() => handleSelectCustomer(customer)}>
                                <User className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Aucun client trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialogue d'ajout de client */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un client</DialogTitle>
            <DialogDescription>Remplissez les informations du nouveau client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'entreprise</Label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Personne de contact</Label>
              <Input
                id="contact"
                value={newCustomer.contact}
                onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                placeholder="Nom et prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddCustomer}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de modification de client */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier un client</DialogTitle>
            <DialogDescription>Modifiez les informations du client.</DialogDescription>
          </DialogHeader>
          {currentCustomer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom de l'entreprise</Label>
                <Input
                  id="edit-name"
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Personne de contact</Label>
                <Input
                  id="edit-contact"
                  value={currentCustomer.contact}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={currentCustomer.phone}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresse</Label>
                <Input
                  id="edit-address"
                  value={currentCustomer.address}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditCustomer}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression de client */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer un client</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce client ?</DialogDescription>
          </DialogHeader>
          {currentCustomer && (
            <div className="py-4">
              <p>
                Vous êtes sur le point de supprimer le client <strong>{currentCustomer.name}</strong>. Cette action est
                irréversible.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
