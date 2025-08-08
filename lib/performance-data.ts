export interface Article {
    depotId: string
    depotName: string
    isRepture: boolean
    product_id: string
    product_name: string
    product_sku: string
    quantity: number
    unit_price: string
    variant_id: number
    variant_options: {
      option1: string
      option2: string
    }
    variant_sku: string
    variant_title: string
  }
  
  export interface ShipmentTrack {
    date: string
    deliveryAttempts: Array<{
      date: string
      notes: string
      result: string
    }>
    description: string
    driver_phone: string
    location: string
    status: string
    title: string
    isIssue?: boolean
  }
  
  export interface StatusHistory {
    changedBy: string
    status: string
    timestamp: string
  }
  
  export interface Order {
    id: string
    additionalInfo: string
    address: string
    articles: Article[]
    commune: string
    commune_id: number
    confirmationStatus: string
    confirmatrice: string
    createdAt: {
      toDate: () => Date
    }
    date: string
    deliveryCenter: string
    deliveryCompany: string
    deliveryPrice: number
    deliveryType: string
    label: string
    lastStatus: string
    name: string
    orderReference: string
    phone: string
    pickupPoint: string
    shippmentTrack: ShipmentTrack[]
    sku: string
    source: string
    status: string
    statusHistory: StatusHistory[]
    totalPrice: number
    trackingId: string
    updatedAt: {
      toDate: () => Date
    }
    wilaya: string
    wilayaCode: string
    wilayaName: string
  }
  
  // Mock data based on the provided structure
  export const mockOrders: Order[] = [
    {
      id: "37Knewm57byFq0bJc3ll",
      additionalInfo: "-, 25 - Constantine قسنطينة, قسنطينة, Algeria",
      address: "Constantine, Algeria",
      articles: [
        {
          depotId: "LIg13HzP3pb9WHmnehSi",
          depotName: "atelier",
          isRepture: false,
          product_id: "9604777640214",
          product_name: "mule sabot 13028",
          product_sku: "sabot mule 13028-37-noir mate",
          quantity: 1,
          unit_price: "1900.00",
          variant_id: 48776763572502,
          variant_options: {
            option1: "38",
            option2: "Noir mate"
          },
          variant_sku: "sabot mule 13028-37-noir mate",
          variant_title: "37 / Noir mate"
        },
        {
          depotId: "LIg13HzP3pb9WHmnehSi",
          depotName: "atelier",
          isRepture: false,
          product_id: "9604777640214",
          product_name: "mule sabot 13028",
          product_sku: "sabot mule 13028-37-noir mate",
          quantity: 1,
          unit_price: "1900.00",
          variant_id: 48776764358934,
          variant_options: {
            option1: "39",
            option2: "Vert d'eaux"
          },
          variant_sku: "",
          variant_title: ""
        }
      ],
      commune: "Constantine",
      commune_id: 2504,
      confirmationStatus: "Confirmé",
      confirmatrice: "amira",
      createdAt: {
        toDate: () => new Date("2025-07-18T19:52:23Z")
      },
      date: "2025-07-18",
      deliveryCenter: "",
      deliveryCompany: "tallin collection",
      deliveryPrice: 800,
      deliveryType: "domicile",
      label: "https://yalidine.app/app/bordereau.php?tracking=yal-K77EWF&token=QlFpUzhBcVdNK05oQnZETUU5cGw5UT09",
      lastStatus: "delivered",
      name: "Moulahem//",
      orderReference: "ATELI-OJL4AX4334",
      phone: "0559376426",
      pickupPoint: "",
      shippmentTrack: [
        {
          date: "2025-07-19 11:34:53",
          deliveryAttempts: [],
          description: "Your package is being prepared for shipping",
          driver_phone: "0559376426",
          location: "null null null",
          status: "in-preparation",
          title: "En préparation"
        },
        {
          date: "2025-07-21 13:34:19",
          deliveryAttempts: [],
          description: "Your package has been delivered",
          driver_phone: "0559376426",
          location: "Agence Sidi Mabrouk [Guepex] Constantine Constantine",
          status: "delivered",
          title: "Livré"
        }
      ],
      sku: "SKU-3302",
      source: "5690175",
      status: "Livrés",
      statusHistory: [
        {
          changedBy: "System",
          status: "Ne répond pas 1",
          timestamp: "2025-07-19T10:09:45.077Z"
        }
      ],
      totalPrice: 4600,
      trackingId: "yal-K77EWF",
      updatedAt: {
        toDate: () => new Date("2025-07-21T12:34:27Z")
      },
      wilaya: "Constantine",
      wilayaCode: "25",
      wilayaName: "Constantine"
    },
    // Generate additional mock orders
    ...Array.from({ length: 149 }, (_, i) => ({
      id: `order-${i + 2}`,
      additionalInfo: `Address ${i + 2}`,
      address: `Address ${i + 2}, Algeria`,
      articles: [
        {
          depotId: "depot-" + (i % 3 + 1),
          depotName: ["atelier", "magasin", "entrepot"][i % 3],
          isRepture: Math.random() > 0.9,
          product_id: `product-${i % 10 + 1}`,
          product_name: [
            "Nike Air Max 90",
            "Adidas Ultraboost",
            "Puma RS-X",
            "New Balance 574",
            "Converse Chuck Taylor",
            "Vans Old Skool",
            "Reebok Classic",
            "Jordan 1 Retro",
            "Asics Gel-Lyte",
            "mule sabot 13028"
          ][i % 10],
          product_sku: `sku-${i + 1}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          unit_price: (Math.floor(Math.random() * 200) + 50).toString() + ".00",
          variant_id: 48776763572502 + i,
          variant_options: {
            option1: ["36", "37", "38", "39", "40", "41", "42"][Math.floor(Math.random() * 7)],
            option2: ["Noir", "Blanc", "Rouge", "Bleu", "Vert"][Math.floor(Math.random() * 5)]
          },
          variant_sku: `variant-sku-${i + 1}`,
          variant_title: "Size / Color"
        }
      ],
      commune: ["Constantine", "Alger", "Oran", "Annaba", "Batna"][Math.floor(Math.random() * 5)],
      commune_id: 2500 + (i % 100),
      confirmationStatus: ["Confirmé", "En attente", "Annulé"][Math.floor(Math.random() * 3)],
      confirmatrice: ["amira", "sarah", "fatima", "aicha", "khadija"][Math.floor(Math.random() * 5)],
      createdAt: {
        toDate: () => new Date(2025, 0, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24))
      },
      date: `2025-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
      deliveryCenter: "",
      deliveryCompany: ["yalidine", "tallin collection", "zr express"][Math.floor(Math.random() * 3)],
      deliveryPrice: [400, 600, 800][Math.floor(Math.random() * 3)],
      deliveryType: ["domicile", "bureau", "point relais"][Math.floor(Math.random() * 3)],
      label: `https://tracking.example.com/${i + 1}`,
      lastStatus: ["in-preparation", "shipped", "out-for-delivery", "delivered", "delivery-failed"][Math.floor(Math.random() * 5)],
      name: `Client ${i + 1}`,
      orderReference: `ORDER-${String(i + 1).padStart(6, '0')}`,
      phone: `055${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      pickupPoint: "",
      shippmentTrack: [],
      sku: `SKU-${i + 1}`,
      source: String(Math.floor(Math.random() * 1000000)),
      status: ["En attente", "Confirmé", "En préparation", "En livraison", "Livrés", "Retourné"][Math.floor(Math.random() * 6)],
      statusHistory: [],
      totalPrice: Math.floor(Math.random() * 5000) + 1000,
      trackingId: `track-${i + 1}`,
      updatedAt: {
        toDate: () => new Date(2025, 0, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24))
      },
      wilaya: ["Constantine", "Alger", "Oran", "Annaba", "Batna"][Math.floor(Math.random() * 5)],
      wilayaCode: String(25 + (i % 48)),
      wilayaName: ["Constantine", "Alger", "Oran", "Annaba", "Batna"][Math.floor(Math.random() * 5)]
    }))
  ]
  