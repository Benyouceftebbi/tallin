import Image from "next/image"
import { Star, CheckCircle, Facebook, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLandingPageBySlug } from "@/lib/firebase"
import { notFound } from "next/navigation"

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const data = await getLandingPageBySlug(params.slug)

  if (!data) {
    notFound()
  }

  // Default values for arrays to prevent errors if they are not in the DB
  const productImages = data.productImages || ["/placeholder.svg?width=600&height=600"]
  const whyChooseUs = data.whyChooseUs || []
  const testimonials = data.testimonials || []
  const faqs = data.faqs || []

  return (
    <div className="bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Image
            src={data.logoUrl || "/placeholder.svg?width=120&height=40"}
            alt={`${data.boutiqueName} Logo`}
            width={120}
            height={40}
          />
          <Button>Order Now</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Product Images */}
          <div className="grid gap-4">
            <Image
              src={productImages[0] || "/placeholder.svg"}
              alt={data.productTitle}
              width={600}
              height={600}
              className="aspect-square object-cover border w-full rounded-lg overflow-hidden shadow-lg"
            />
            <div className="grid grid-cols-4 gap-4">
              {productImages.slice(1, 4).map((img: string, i: number) => (
                <button
                  key={i}
                  className="border-2 border-transparent hover:border-primary rounded-lg overflow-hidden transition-colors"
                >
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`Thumbnail ${i + 1}`}
                    width={100}
                    height={100}
                    className="aspect-square object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data.productTitle}</h1>
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-primary">${data.priceAfter}</span>
              <span className="text-2xl text-gray-400 line-through">${data.priceBefore}</span>
            </div>
            <p className="text-lg text-gray-600">
              Experience unparalleled comfort and style with our limited edition tee. Made from the finest materials,
              it's designed to be your new favorite shirt.
            </p>
            <Button size="lg" className="w-full py-6 text-lg">
              Click Here to Order on WhatsApp
            </Button>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <section className="py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-10">Why You'll Love It</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {whyChooseUs.map((feature: any, i: number) => (
              <div key={i} className="p-6 bg-white rounded-lg shadow-md">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-12 md:py-20 bg-white rounded-lg shadow-lg px-6">
          <h2 className="text-3xl font-bold text-center mb-10">What Our Customers Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial: any, i: number) => (
              <Card key={i}>
                <CardHeader className="flex-row gap-4 items-center">
                  <Image
                    src="/placeholder-user.jpg"
                    alt={testimonial.clientName}
                    width={56}
                    height={56}
                    className="rounded-full"
                  />
                  <div>
                    <CardTitle>{testimonial.clientName}</CardTitle>
                    <p className="text-sm text-gray-500">{testimonial.wilaya}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, s_i) => (
                      <Star
                        key={s_i}
                        className={`h-5 w-5 ${s_i < testimonial.stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.review}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-20">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            {faqs.map((faq: any, i: number) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-lg font-semibold">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="font-semibold text-lg mb-2">
            &copy; {new Date().getFullYear()} {data.boutiqueName}. All Rights Reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a
              href={data.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href={data.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              <Instagram className="h-6 w-6" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
