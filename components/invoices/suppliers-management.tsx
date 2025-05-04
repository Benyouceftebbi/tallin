"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Pencil, Plus, Save, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Type pour les fournisseurs
export type Supplier = {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
}

// Données d'exemple pour les fournisseurs
export const initialSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Fournisseur Électronique",
    contact: "Jean Dupont",
    email: "contact@fournisseur-electronique.com",
    phone: "01 23 45 67 89",
    address: "123 Rue de l'Innovation, 75001 Paris",
  },
  {
    id: "sup-2",
    name: "Textile Premium",
    contact: "Marie Martin",
    email: "info@textile-premium.com",
    phone: "01 98 76 54 32",
    address: "45 Avenue de la Mode, 69002 Lyon",
  },
  {
    id: "sup-3",
    name: "Accessoires Luxe",
    contact: "Pierre Durand",
    email: "contact@accessoires-luxe.com",
    phone: "03 45 67 89 10",
    address: "78 Boulevard Haussmann, 75008 Paris",
  },
]

interface SupplierFormProps {
  supplier: Supplier | null
  onSave: (supplier: Supplier) => void
  onCancel: () => void
}

function SupplierForm({ supplier, onSave, onCancel }: SupplierFormProps) {
  const [formData, setFormData] = useState<Supplier>(
    supplier || {
      id: `sup-${Date.now()}`,
      name: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
    },
  )

  const handleChange = (field: keyof Supplier, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast({
        title: "Erreur",
        description: "Le nom du fournisseur est requis.",
        variant: "destructive",
      })
      return
    }

    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du fournisseur</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nom du fournisseur"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact">Personne de contact</Label>
        <Input
          id="contact"
          value={formData.contact}
          onChange={(e) => handleChange("contact", e.target.value)}
          placeholder="Nom du contact"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@exemple.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="01 23 45 67 89"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Adresse complète"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

interface SupplierDeleteConfirmProps {
  supplier: Supplier
  onConfirm: () => void
  onCancel: () => void
}

function SupplierDeleteConfirm({ supplier, onConfirm, onCancel }: SupplierDeleteConfirmProps) {
  return (
    <div className="space-y-4">
      <p>
        Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{supplier.name}</strong> ?
      </p>
      <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm}>
          Supprimer
        </Button>
      </div>
    </div>
  )
}

interface SuppliersManagementProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectSupplier?: (supplier: Supplier) => void
  selectable?: boolean
}

export function SuppliersManagement({
  open,
  onOpenChange,
  onSelectSupplier,
  selectable = false,
}: SuppliersManagementProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)

  const handleSaveSupplier = (supplier: Supplier) => {
    if (editingSupplier) {
      // Mise à jour d'un fournisseur existant
      setSuppliers(suppliers?.map((s) => (s.id === supplier.id ? supplier : s)))
      setEditingSupplier(null)
      toast({
        title: "Fournisseur mis à jour",
        description: `Le fournisseur ${supplier.name} a été mis à jour avec succès.`,
      })
    } else {
      // Ajout d'un nouveau fournisseur
      setSuppliers([...suppliers, supplier])
      setIsAddingSupplier(false)
      toast({
        title: "Fournisseur ajouté",
        description: `Le fournisseur ${supplier.name} a été ajouté avec succès.`,
      })
    }
  }

  const handleDeleteSupplier = () => {
    if (deletingSupplier) {
      setSuppliers(suppliers.filter((s) => s.id !== deletingSupplier.id))
      setDeletingSupplier(null)
      toast({
        title: "Fournisseur supprimé",
        description: `Le fournisseur ${deletingSupplier.name} a été supprimé avec succès.`,
      })
    }
  }

  const handleSelectSupplier = (supplier: Supplier) => {
    if (onSelectSupplier) {
      onSelectSupplier(supplier)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestion des fournisseurs</SheetTitle>
          <SheetDescription>Ajoutez, modifiez ou supprimez des fournisseurs.</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Liste des fournisseurs</h3>
            <Button onClick={() => setIsAddingSupplier(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers?.map((supplier) => (
                  <TableRow key={supplier.id} className={selectable ? "cursor-pointer hover:bg-muted/50" : ""}>
                    <TableCell
                      className="font-medium"
                      onClick={selectable ? () => handleSelectSupplier(supplier) : undefined}
                    >
                      {supplier.name}
                    </TableCell>
                    <TableCell onClick={selectable ? () => handleSelectSupplier(supplier) : undefined}>
                      {supplier.contact}
                    </TableCell>
                    <TableCell onClick={selectable ? () => handleSelectSupplier(supplier) : undefined}>
                      {supplier.email}
                    </TableCell>
                    <TableCell onClick={selectable ? () => handleSelectSupplier(supplier) : undefined}>
                      {supplier.phone}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingSupplier(supplier)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingSupplier(supplier)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Aucun fournisseur trouvé.
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

      {/* Dialogue pour ajouter un fournisseur */}
      <Dialog open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un fournisseur</DialogTitle>
            <DialogDescription>Remplissez les informations du nouveau fournisseur.</DialogDescription>
          </DialogHeader>
          <SupplierForm supplier={null} onSave={handleSaveSupplier} onCancel={() => setIsAddingSupplier(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialogue pour modifier un fournisseur */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier un fournisseur</DialogTitle>
            <DialogDescription>Modifiez les informations du fournisseur.</DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <SupplierForm
              supplier={editingSupplier}
              onSave={handleSaveSupplier}
              onCancel={() => setEditingSupplier(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue pour confirmer la suppression */}
      <Dialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          {deletingSupplier && (
            <SupplierDeleteConfirm
              supplier={deletingSupplier}
              onConfirm={handleDeleteSupplier}
              onCancel={() => setDeletingSupplier(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
