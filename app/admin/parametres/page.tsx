"use client"

import { useState, useEffect } from "react"
import { collection, doc, setDoc, getDocs, query } from "firebase/firestore"
import { Save, Plus, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useShop } from "@/context/shop-context"
import { db } from "@/lib/firebase"

export default function ParametresPage() {
  const {
    deliveryCompanies,
    deliveryMen,
    availableCompanies,
    addDeliveryCompany,
    updateDeliveryCompany,
    deleteDeliveryCompany,
    addDeliveryMan,
    updateDeliveryMan,
    deleteDeliveryMan,
  } = useShop()

  const [companyName, setCompanyName] = useState("E-Commerce CRM")
  const [email, setEmail] = useState("contact@ecommerce-crm.com")
  const [phone, setPhone] = useState("+33 1 23 45 67 89")
  const [address, setAddress] = useState("123 Rue de Commerce, 75001 Paris")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [language, setLanguage] = useState("fr")
  const [currency, setCurrency] = useState("EUR")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")

  // State for form
  const [newEntityType, setNewEntityType] = useState<"company" | "deliveryMan">("company")
  const [selectedCompanyId, setSelectedCompanyId] = useState("")
  const [newEntityName, setNewEntityName] = useState("")
  const [newEntityEmail, setNewEntityEmail] = useState("")
  const [newEntityStartDate, setNewEntityStartDate] = useState("")
  const [newEntityApiId, setNewEntityApiId] = useState("")
  const [newEntityApiToken, setNewEntityApiToken] = useState("")
  const [newEntityPhone, setNewEntityPhone] = useState("")
  const [newEntityAddress, setNewEntityAddress] = useState("")
  const [newEntityWebhookUrl, setNewEntityWebhookUrl] = useState("")
  const [newEntityWebhookName, setNewEntityWebhookName] = useState("")
  const [selectedDeliveryCompanies, setSelectedDeliveryCompanies] = useState<string[]>([])
const [newEntityCompanyName, setNewEntityCompanyName] = useState("")
  // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<"company" | "deliveryMan" | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    companyId: "",
    startDate: "",
    apiId: "",
    apiToken: "",
    phone: "",
    address: "",
    webhookUrl: "",
    webhookName: "",
    companies: [] as string[],
    entity:""
  })

  // State for delivery pricing
  const [deliveryPrices, setDeliveryPrices] = useState<{
    [wilaya: string]: { stopdesk: number; domicile: number }
  }>({})
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [savingPrices, setSavingPrices] = useState(false)

  // List of Algerian wilayas
  const algerianWilayas = [
    { code: "01", name: "Adrar" },
    { code: "02", name: "Chlef" },
    { code: "03", name: "Laghouat" },
    { code: "04", name: "Oum El Bouaghi" },
    { code: "05", name: "Batna" },
    { code: "06", name: "Béjaïa" },
    { code: "07", name: "Biskra" },
    { code: "08", name: "Béchar" },
    { code: "09", name: "Blida" },
    { code: "10", name: "Bouira" },
    { code: "11", name: "Tamanrasset" },
    { code: "12", name: "Tébessa" },
    { code: "13", name: "Tlemcen" },
    { code: "14", name: "Tiaret" },
    { code: "15", name: "Tizi Ouzou" },
    { code: "16", name: "Alger" },
    { code: "17", name: "Djelfa" },
    { code: "18", name: "Jijel" },
    { code: "19", name: "Sétif" },
    { code: "20", name: "Saïda" },
    { code: "21", name: "Skikda" },
    { code: "22", name: "Sidi Bel Abbès" },
    { code: "23", name: "Annaba" },
    { code: "24", name: "Guelma" },
    { code: "25", name: "Constantine" },
    { code: "26", name: "Médéa" },
    { code: "27", name: "Mostaganem" },
    { code: "28", name: "M'Sila" },
    { code: "29", name: "Mascara" },
    { code: "30", name: "Ouargla" },
    { code: "31", name: "Oran" },
    { code: "32", name: "El Bayadh" },
    { code: "33", name: "Illizi" },
    { code: "34", name: "Bordj Bou Arréridj" },
    { code: "35", name: "Boumerdès" },
    { code: "36", name: "El Tarf" },
    { code: "37", name: "Tindouf" },
    { code: "38", name: "Tissemsilt" },
    { code: "39", name: "El Oued" },
    { code: "40", name: "Khenchela" },
    { code: "41", name: "Souk Ahras" },
    { code: "42", name: "Tipaza" },
    { code: "43", name: "Mila" },
    { code: "44", name: "Aïn Defla" },
    { code: "45", name: "Naâma" },
    { code: "46", name: "Aïn Témouchent" },
    { code: "47", name: "Ghardaïa" },
    { code: "48", name: "Relizane" },
    { code: "49", name: "El M'Ghair" },
    { code: "50", name: "El Meniaa" },
    { code: "51", name: "Ouled Djellal" },
    { code: "52", name: "Bordj Badji Mokhtar" },
    { code: "53", name: "Béni Abbès" },
    { code: "54", name: "Timimoun" },
    { code: "55", name: "Touggourt" },
    { code: "56", name: "Djanet" },
    { code: "57", name: "In Salah" },
    { code: "58", name: "In Guezzam" },
  ]

  // Load delivery prices from Firebase
  useEffect(() => {
    const loadDeliveryPrices = async () => {
      try {
        setIsLoadingPrices(true)
        const pricesQuery = query(collection(db, "deliveryPrices"))
        const snapshot = await getDocs(pricesQuery)

        const prices: { [wilaya: string]: { stopdesk: number; domicile: number } } = {}
        snapshot.forEach((doc) => {
          prices[doc.id] = doc.data() as { stopdesk: number; domicile: number }
        })

        // If no prices exist yet, initialize with default values for all wilayas
        if (snapshot.empty) {
          const defaultPrices: { [wilaya: string]: { stopdesk: number; domicile: number } } = {}
          algerianWilayas.forEach((wilaya) => {
            defaultPrices[wilaya.code] = { stopdesk: 400, domicile: 600 }
          })
          setDeliveryPrices(defaultPrices)
        } else {
          setDeliveryPrices(prices)
        }
      } catch (error) {
        console.error("Error loading delivery prices:", error)
      } finally {
        setIsLoadingPrices(false)
      }
    }

    loadDeliveryPrices()
  }, [])

  // Save delivery prices to Firebase
  const saveDeliveryPrices = async () => {
    try {
      setSavingPrices(true)

      // Save each wilaya's prices as a separate document
      for (const [wilayaCode, prices] of Object.entries(deliveryPrices)) {
        await setDoc(doc(db, "deliveryPrices", wilayaCode), prices)
      }

      alert("Les tarifs de livraison ont été enregistrés avec succès.")
    } catch (error) {
      console.error("Error saving delivery prices:", error)
      alert("Une erreur s'est produite lors de l'enregistrement des tarifs.")
    } finally {
      setSavingPrices(false)
    }
  }

  // Handle price change for a specific wilaya
  const handlePriceChange = (wilayaCode: string, type: "stopdesk" | "domicile", value: string) => {
    const numValue = Number.parseInt(value) || 0
    setDeliveryPrices((prev) => ({
      ...prev,
      [wilayaCode]: {
        ...prev[wilayaCode],
        [type]: numValue,
      },
    }))
  }

  const handleAddEntity = () => {
    if (newEntityType === "company") {
      if (!selectedCompanyId) return

      const selectedCompany = availableCompanies.find((company) => company.id === selectedCompanyId)
      if (!selectedCompany) return

      addDeliveryCompany({
        name: selectedCompany.label,
        companyId: selectedCompanyId,
        email: newEntityEmail,
        apiId: newEntityApiId,
        apiToken: newEntityApiToken,
        webhookUrl: newEntityWebhookUrl,
        webhookName: newEntityWebhookName,
        phone: newEntityPhone,
        entity:newEntityCompanyName
      })
    } else {
      if (!newEntityName || !newEntityEmail || !newEntityStartDate) return

      addDeliveryMan({
        name: newEntityName,
        email: newEntityEmail,
        startDate: newEntityStartDate,
        phone: newEntityPhone,
        address: newEntityAddress,
        companies: selectedDeliveryCompanies,
      })
    }

    // Reset form
    setSelectedCompanyId("")
    setNewEntityName("")
    setNewEntityEmail("")
    setNewEntityStartDate("")
    setNewEntityApiId("")
    setNewEntityApiToken("")
    setNewEntityPhone("")
    setNewEntityAddress("")
    setNewEntityWebhookUrl("")
    setNewEntityWebhookName("")
    setSelectedDeliveryCompanies([])
    setNewEntityCompanyName("")
  }

  const handleCompanySelection = (companyId: string) => {
    setSelectedDeliveryCompanies((current) => {
      if (current.includes(companyId)) {
        return current.filter((id) => id !== companyId)
      } else {
        return [...current, companyId]
      }
    })
  }

  const handleEditCompanySelection = (companyId: string) => {
    setEditForm((prev) => {
      const companies = prev.companies || []
      if (companies.includes(companyId)) {
        return {
          ...prev,
          companies: companies.filter((id) => id !== companyId),
        }
      } else {
        return {
          ...prev,
          companies: [...companies, companyId],
        }
      }
    })
  }

  const openEditDialog = (id: string, type: "company" | "deliveryMan") => {
    setEditingId(id)
    setEditingType(type)

    if (type === "company") {
      const company = deliveryCompanies.find((c) => c.id === id)
      if (company) {
        setEditForm({
          name: company.name,
          email: company.email || "",
          companyId: company.companyId,
          apiId: company.apiId || "",
          apiToken: company.apiToken || "",
          webhookUrl: company.webhookUrl || "",
          webhookName: company.webhookName || "",
          phone: company.phone || "",
          startDate: "",
          address: "",
          companies: [],
        })
      }
    } else {
      const man = deliveryMen.find((m) => m.id === id)
      if (man) {
        setEditForm({
          name: man.name,
          email: man.email,
          startDate: man.startDate,
          phone: man.phone || "",
          address: man.address || "",
          companies: man.companies || [],
          companyId: "",
          apiId: "",
          apiToken: "",
          webhookUrl: "",
          webhookName: "",
        })
      }
    }

    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingType) return

    if (editingType === "company") {
      updateDeliveryCompany(editingId, {
        email: editForm.email,
        apiId: editForm.apiId,
        apiToken: editForm.apiToken,
        webhookUrl: editForm.webhookUrl,
        webhookName: editForm.webhookName,
        phone: editForm.phone,
        entity:editForm.entity
      })
    } else {
      updateDeliveryMan(editingId, {
        name: editForm.name,
        email: editForm.email,
        startDate: editForm.startDate,
        phone: editForm.phone,
        address: editForm.address,
        companies: editForm.companies,
      })
    }

    setIsEditDialogOpen(false)
    setEditingId(null)
    setEditingType(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre système CRM.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="delivery">Sociétés de livraison</TabsTrigger>
          <TabsTrigger value="pricing">Tarifs de livraison</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>Modifiez les informations de base de votre entreprise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nom de l'entreprise</Label>
                  <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres régionaux</CardTitle>
              <CardDescription>Configurez les paramètres de langue et de devise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Sélectionner une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                      <SelectItem value="es">Espagnol</SelectItem>
                      <SelectItem value="de">Allemand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dollar américain ($)</SelectItem>
                      <SelectItem value="GBP">Livre sterling (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Format de date</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>Configurez comment et quand vous recevez des notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email pour les nouvelles commandes et mises à jour.
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-notifications">Notifications par SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par SMS pour les événements importants.
                    </p>
                  </div>
                  <Switch id="sms-notifications" checked={smsNotifications} onCheckedChange={setSmsNotifications} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
              <CardDescription>Personnalisez l'apparence de votre interface CRM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="justify-start">
                      <span className="h-4 w-4 rounded-full bg-background border mr-2"></span>
                      Clair
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <span className="h-4 w-4 rounded-full bg-black mr-2"></span>
                      Sombre
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <span className="h-4 w-4 rounded-full bg-gradient-to-r from-gray-200 to-gray-800 mr-2"></span>
                      Système
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Densité</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" className="justify-start">
                      Compacte
                    </Button>
                    <Button variant="outline" className="justify-start">
                      Normale
                    </Button>
                    <Button variant="outline" className="justify-start">
                      Confortable
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4 mt-4">
 <Card>
    <CardHeader>
      <CardTitle>Sociétés de livraison</CardTitle>
      <CardDescription>Gérez les sociétés de livraison et les livreurs.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Ajouter une nouvelle entité</h3>

          <div className="space-y-4">
            <RadioGroup
              value={newEntityType}
              onValueChange={(value) => setNewEntityType(value as "company" | "deliveryMan")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company">Société de livraison</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deliveryMan" id="deliveryMan" />
                <Label htmlFor="deliveryMan">Livreur</Label>
              </div>
            </RadioGroup>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newEntityType === "company" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company-select">Société de livraison</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger id="company-select">
                        <SelectValue placeholder="Sélectionner une société" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-name-reference">Nom de référence</Label>
                    <Input
                      id="company-name-reference"
                      value={newEntityCompanyName}
                      onChange={(e) => setNewEntityCompanyName(e.target.value)}
                      placeholder="Ex: Yalidine Alger"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="entity-name">Nom du livreur</Label>
                  <Input
                    id="entity-name"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="entity-email">Email</Label>
                <Input
                  id="entity-email"
                  type="email"
                  value={newEntityEmail}
                  onChange={(e) => setNewEntityEmail(e.target.value)}
                  placeholder={newEntityType === "company" ? "Ex: contact@yalidine.com" : "Ex: jean.dupont@example.com"}
                />
              </div>

              {newEntityType === "company" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="entity-webhook-url">URL du Webhook</Label>
                    <Input
                      id="entity-webhook-url"
                      value={newEntityWebhookUrl}
                      onChange={(e) => setNewEntityWebhookUrl(e.target.value)}
                      placeholder="Ex: https://api.company.com/webhook"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-webhook-name">Nom du Webhook</Label>
                    <Input
                      id="entity-webhook-name"
                      value={newEntityWebhookName}
                      onChange={(e) => setNewEntityWebhookName(e.target.value)}
                      placeholder="Ex: Order Status Updates"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-api-id">ID API</Label>
                    <Input
                      id="entity-api-id"
                      value={newEntityApiId}
                      onChange={(e) => setNewEntityApiId(e.target.value)}
                      placeholder="Entrez votre ID API"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-api-token">Token API</Label>
                    <Input
                      id="entity-api-token"
                      value={newEntityApiToken}
                      onChange={(e) => setNewEntityApiToken(e.target.value)}
                      placeholder="Entrez votre token API"
                      type="password"
                    />
                  </div>
                </>
              )}

              {newEntityType === "deliveryMan" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="entity-start-date">Date de début</Label>
                    <Input
                      id="entity-start-date"
                      type="date"
                      value={newEntityStartDate}
                      onChange={(e) => setNewEntityStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-phone">Téléphone</Label>
                    <Input
                      id="entity-phone"
                      value={newEntityPhone}
                      onChange={(e) => setNewEntityPhone(e.target.value)}
                      placeholder="Ex: +33 6 12 34 56 78"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-address">Adresse</Label>
                    <Textarea
                      id="entity-address"
                      value={newEntityAddress}
                      onChange={(e) => setNewEntityAddress(e.target.value)}
                      placeholder="Ex: 123 Rue de Paris, 75001 Paris"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Sociétés de livraison</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {availableCompanies.map((company) => (
                        <div key={company.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`company-${company.id}`}
                            checked={selectedDeliveryCompanies.includes(company.id)}
                            onCheckedChange={() => handleCompanySelection(company.id)}
                          />
                          <Label htmlFor={`company-${company.id}`} className="text-sm font-normal">
                            {company.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button onClick={handleAddEntity} className="mt-2">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter {newEntityType === "company" ? "la société" : "le livreur"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Sociétés de livraison</h3>

          {deliveryCompanies.length === 0 ? (
            <Alert>
              <AlertDescription>Aucune société de livraison n'a été ajoutée pour le moment.</AlertDescription>
            </Alert>
          ) : (
            <Accordion type="multiple" className="w-full">
              {deliveryCompanies.map((company) => (
                <AccordionItem key={company.id} value={company.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">{company.name}</span>
                      {company.label && company.label !== company.name && (
                        <span className="ml-2 text-xs text-slate-500">({company.label})</span>
                      )}
                      <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                        Société de livraison
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {company.email && (
                          <div>
                            <Label className="text-sm font-medium">Email</Label>
                            <p className="text-sm">{company.email}</p>
                          </div>
                        )}
                        {company.phone && (
                          <div>
                            <Label className="text-sm font-medium">Téléphone</Label>
                            <p className="text-sm">{company.phone}</p>
                          </div>
                        )}
                        {company.webhookUrl && (
                          <div>
                            <Label className="text-sm font-medium">URL du Webhook</Label>
                            <p className="text-sm">{company.webhookUrl}</p>
                          </div>
                        )}
                        {company.webhookName && (
                          <div>
                            <Label className="text-sm font-medium">Nom du Webhook</Label>
                            <p className="text-sm">{company.webhookName}</p>
                          </div>
                        )}
                        {company.apiId && (
                          <div>
                            <Label className="text-sm font-medium">ID API</Label>
                            <p className="text-sm">••••••••••••••••</p>
                          </div>
                        )}
                        {company.apiToken && (
                          <div>
                            <Label className="text-sm font-medium">Token API</Label>
                            <p className="text-sm">••••••••••••••••</p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(company.id, "company")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteDeliveryCompany(company.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-lg font-medium">Livreurs</h3>

          {deliveryMen.length === 0 ? (
            <Alert>
              <AlertDescription>Aucun livreur n'a été ajouté pour le moment.</AlertDescription>
            </Alert>
          ) : (
            <Accordion type="multiple" className="w-full">
              {deliveryMen.map((man) => (
                <AccordionItem key={man.id} value={man.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium">{man.name}</span>
                      <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">
                        Livreur
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm">{man.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Date de début</Label>
                          <p className="text-sm">{man.startDate}</p>
                        </div>
                        {man.phone && (
                          <div>
                            <Label className="text-sm font-medium">Téléphone</Label>
                            <p className="text-sm">{man.phone}</p>
                          </div>
                        )}
                        {man.address && (
                          <div>
                            <Label className="text-sm font-medium">Adresse</Label>
                            <p className="text-sm">{man.address}</p>
                          </div>
                        )}
                        {man.companies && man.companies.length > 0 && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium">Sociétés de livraison</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {man.companies.map((companyId) => {
                                const company = availableCompanies.find((c) => c.id === companyId)
                                return company ? (
                                  <span
                                    key={companyId}
                                    className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full"
                                  >
                                    {company.label}
                                  </span>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(man.id, "deliveryMan")}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteDeliveryMan(man.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button>
        <Save className="mr-2 h-4 w-4" />
        Enregistrer les modifications
      </Button>
    </CardFooter>
  </Card>
        </TabsContent>
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarifs de livraison par wilaya</CardTitle>
              <CardDescription>
                Définissez les tarifs de livraison pour chaque wilaya en Algérie, pour les modes "Stop Desk" et "À
                Domicile".
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPrices ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Set all stopdesk prices to the same value
                          const value = prompt("Entrez le prix Stop Desk pour toutes les wilayas:")
                          if (value !== null) {
                            const numValue = Number.parseInt(value) || 0
                            const updatedPrices = { ...deliveryPrices }
                            algerianWilayas.forEach((wilaya) => {
                              updatedPrices[wilaya.code] = {
                                ...updatedPrices[wilaya.code],
                                stopdesk: numValue,
                              }
                            })
                            setDeliveryPrices(updatedPrices)
                          }
                        }}
                      >
                        Définir tous les prix Stop Desk
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Set all domicile prices to the same value
                          const value = prompt("Entrez le prix À Domicile pour toutes les wilayas:")
                          if (value !== null) {
                            const numValue = Number.parseInt(value) || 0
                            const updatedPrices = { ...deliveryPrices }
                            algerianWilayas.forEach((wilaya) => {
                              updatedPrices[wilaya.code] = {
                                ...updatedPrices[wilaya.code],
                                domicile: numValue,
                              }
                            })
                            setDeliveryPrices(updatedPrices)
                          }
                        }}
                      >
                        Définir tous les prix À Domicile
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="search-wilaya">Rechercher:</Label>
                      <Input
                        id="search-wilaya"
                        placeholder="Nom de wilaya..."
                        className="w-[200px]"
                        onChange={(e) => {
                          const searchElement = document.getElementById("search-wilaya") as HTMLInputElement
                          const searchTerm = e.target.value.toLowerCase()

                          document.querySelectorAll("[data-wilaya-row]").forEach((row) => {
                            const wilayaName = row.getAttribute("data-wilaya-name")?.toLowerCase() || ""
                            const wilayaCode = row.getAttribute("data-wilaya-code")?.toLowerCase() || ""

                            if (wilayaName.includes(searchTerm) || wilayaCode.includes(searchTerm)) {
                              ;(row as HTMLElement).style.display = ""
                            } else {
                              ;(row as HTMLElement).style.display = "none"
                            }
                          })
                        }}
                      />
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <div className="grid grid-cols-4 gap-4 p-4 font-medium bg-muted">
                      <div>Code</div>
                      <div>Wilaya</div>
                      <div>Prix Stop Desk (DA)</div>
                      <div>Prix À Domicile (DA)</div>
                    </div>
                    <div className="divide-y">
                      {algerianWilayas.map((wilaya) => (
                        <div
                          key={wilaya.code}
                          className="grid grid-cols-4 gap-4 p-4 items-center"
                          data-wilaya-row
                          data-wilaya-name={wilaya.name}
                          data-wilaya-code={wilaya.code}
                        >
                          <div className="font-medium">{wilaya.code}</div>
                          <div>{wilaya.name}</div>
                          <div>
                            <Input
                              type="number"
                              min="0"
                              value={deliveryPrices[wilaya.code]?.stopdesk || 0}
                              onChange={(e) => handlePriceChange(wilaya.code, "stopdesk", e.target.value)}
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              min="0"
                              value={deliveryPrices[wilaya.code]?.domicile || 0}
                              onChange={(e) => handlePriceChange(wilaya.code, "domicile", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={saveDeliveryPrices} disabled={savingPrices}>
                {savingPrices ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les tarifs
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier {editingType === "company" ? "la société de livraison" : "le livreur"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editingType === "company" ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-webhook-url" className="text-right">
                    URL du Webhook
                  </Label>
                  <Input
                    id="edit-webhook-url"
                    value={editForm.webhookUrl}
                    onChange={(e) => setEditForm({ ...editForm, webhookUrl: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-webhook-name" className="text-right">
                    Nom du Webhook
                  </Label>
                  <Input
                    id="edit-webhook-name"
                    value={editForm.webhookName}
                    onChange={(e) => setEditForm({ ...editForm, webhookName: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-api-id" className="text-right">
                    ID API
                  </Label>
                  <Input
                    id="edit-api-id"
                    value={editForm.apiId}
                    onChange={(e) => setEditForm({ ...editForm, apiId: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-api-token" className="text-right">
                    Token API
                  </Label>
                  <Input
                    id="edit-api-token"
                    value={editForm.apiToken}
                    onChange={(e) => setEditForm({ ...editForm, apiToken: e.target.value })}
                    type="password"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-phone" className="text-right">
                    Téléphone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Nom
                  </Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-start-date" className="text-right">
                    Date de début
                  </Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-phone" className="text-right">
                    Téléphone
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-address" className="text-right">
                    Adresse
                  </Label>
                  <Textarea
                    id="edit-address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <Label className="text-right pt-2">Sociétés</Label>
                  <div className="col-span-3">
                    <div className="grid grid-cols-2 gap-2">
                      {availableCompanies.map((company) => (
                        <div key={company.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-company-${company.id}`}
                            checked={editForm.companies.includes(company.id)}
                            onCheckedChange={() => handleEditCompanySelection(company.id)}
                          />
                          <Label htmlFor={`edit-company-${company.id}`} className="text-sm font-normal">
                            {company.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSaveEdit}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
