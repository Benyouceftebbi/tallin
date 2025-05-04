"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ParametresPage() {
  const [companyName, setCompanyName] = useState("E-Commerce CRM")
  const [email, setEmail] = useState("contact@ecommerce-crm.com")
  const [phone, setPhone] = useState("+33 1 23 45 67 89")
  const [address, setAddress] = useState("123 Rue de Commerce, 75001 Paris")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [language, setLanguage] = useState("fr")
  const [currency, setCurrency] = useState("EUR")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre système CRM.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
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

        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>Gérez les utilisateurs et leurs permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cette section permet de gérer les utilisateurs qui ont accès au système CRM. Vous pouvez ajouter,
                modifier ou supprimer des utilisateurs et définir leurs rôles et permissions.
              </p>
              <Button>Ajouter un utilisateur</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
