"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { Facebook, Instagram, Trash2, PlusCircle, Upload, Phone, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { FC } from "react"

const landingPageSchema = z.object({
  productId: z.string().min(1, "Please select a product."),
  boutiqueName: z.string().min(2, "Boutique name is required."),
  logoUrl: z.string().optional(),
  productTitle: z.string().min(5, "Product title is required."),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  priceBefore: z.coerce.number().positive(),
  priceAfter: z.coerce.number().positive(),
  whyChooseUs: z.array(
    z.object({
      icon: z.string().optional(),
      title: z.string().min(3, "Title is required."),
      description: z.string().min(10, "Description is required."),
      pictureUrl: z.string().optional(),
    }),
  ),
  testimonials: z.array(
    z.object({
      clientName: z.string().min(2, "Client name is required."),
      stars: z.coerce.number().min(1).max(5),
      review: z.string().min(10, "Review is required."),
      wilaya: z.string().min(2, "Wilaya is required."),
      pictureUrl: z.string().optional(),
    }),
  ),
  faqs: z.array(
    z.object({
      question: z.string().min(5, "Question is required."),
      answer: z.string().min(10, "Answer is required."),
    }),
  ),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  whatsappNumber: z.string().min(8, "A valid phone number is required."),
})

type LandingPageFormValues = z.infer<typeof landingPageSchema>

interface Product {
  id: string
  name: string
  variants: { id: string; name: string; price: number }[]
}

interface LandingPageFormProps {
  products: Product[]
  initialData?: Partial<LandingPageFormValues>
  onSave: (data: LandingPageFormValues) => Promise<void>
  isSaving: boolean
}

export const LandingPageForm: FC<LandingPageFormProps> = ({ products, initialData, onSave, isSaving }) => {
  const form = useForm<LandingPageFormValues>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: initialData || {
      productId: "",
      boutiqueName: "",
      productTitle: "",
      slug: "",
      priceBefore: 0,
      priceAfter: 0,
      whyChooseUs: [],
      testimonials: [],
      faqs: [],
      facebookUrl: "",
      instagramUrl: "",
      whatsappNumber: "",
    },
  })

  const {
    fields: whyChooseUsFields,
    append: appendWhy,
    remove: removeWhy,
  } = useFieldArray({
    control: form.control,
    name: "whyChooseUs",
  })
  const {
    fields: testimonialFields,
    append: appendTestimonial,
    remove: removeTestimonial,
  } = useFieldArray({
    control: form.control,
    name: "testimonials",
  })
  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control: form.control,
    name: "faqs",
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Product & Boutique Info */}
            <Card>
              <CardHeader>
                <CardTitle>Boutique & Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Product from Inventory</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boutiqueName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boutique Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Acme Fashion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title for Landing Page</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Ultimate Comfort Tee" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ultimate-comfort-tee" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be the page URL: your-site.com/landing/<b>your-slug</b>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceBefore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Before</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="150" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceAfter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price After (Sale Price)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="99" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us Section */}
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Us Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {whyChooseUsFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                    <FormField
                      control={form.control}
                      name={`whyChooseUs.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Premium Quality" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`whyChooseUs.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the feature..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWhy(index)}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendWhy({ title: "", description: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
                </Button>
              </CardContent>
            </Card>

            {/* Testimonials Section */}
            <Card>
              <CardHeader>
                <CardTitle>Testimonials Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonialFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                    <FormField
                      control={form.control}
                      name={`testimonials.${index}.clientName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`testimonials.${index}.wilaya`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wilaya</FormLabel>
                          <FormControl>
                            <Input placeholder="Algiers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`testimonials.${index}.stars`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating (1-5)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`testimonials.${index}.review`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Review</FormLabel>
                          <FormControl>
                            <Textarea placeholder="The product is amazing..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTestimonial(index)}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTestimonial({ clientName: "", wilaya: "", stars: 5, review: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Testimonial
                </Button>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>FAQ Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                    <FormField
                      control={form.control}
                      name={`faqs.${index}.question`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Input placeholder="What is the return policy?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`faqs.${index}.answer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer</FormLabel>
                          <FormControl>
                            <Textarea placeholder="You can return within 30 days..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFaq(index)}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendFaq({ question: "", answer: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add FAQ
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Social & Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Social & Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boutique Logo</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input type="file" className="flex-1" />
                          <Button type="button" size="icon" variant="ghost">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>Upload your boutique's logo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <FormField
                  control={form.control}
                  name="facebookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook Page URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="https://facebook.com/..." className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram Profile URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="https://instagram.com/..." className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="+1234567890" className="pl-8" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Landing Page"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
