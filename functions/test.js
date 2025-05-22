const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
// Initialize Firebase Admin
const firebaseConfig = {
 apiKey: "AIzaSyDf8fWEqcsW4MW5xUj-jXIUiSRKib06GpQ",
  authDomain: "tullin-ecce0.firebaseapp.com",
  projectId: "tullin-ecce0",
  storageBucket: "tullin-ecce0.firebasestorage.app",
  messagingSenderId: "731579369642",
  appId: "1:731579369642:web:cb2267044a6f3d34e6e8d3"
};
admin.initializeApp(firebaseConfig);
const db = getFirestore();
const addDepotsToBackend = async ()=> {
  try {
   

    const depots = [
    {
      id: "depot1",
      name: "Dépôt A",
      location: "Zone Industrielle, Alger",
      manager: "Mohamed Ali",
      capacity: "5000 m²",
      status: "active",
      priority: "principale",
      type: "principale",
      quantity: 500,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot2",
      name: "Dépôt B",
      location: "Centre Ville, Oran",
      type: "principale",
      manager: "Karim Benzema",
      capacity: "2500 m²",
      status: "active",
      priority: "principale",
      quantity: 300,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot3",
      name: "Dépôt C",
      location: "Port, Annaba",
      manager: "Sofiane Feghouli",
      capacity: "3000 m²",
      status: "maintenance",
      priority: "principale",
      type: "principale",
      quantity: 400,
      productId: "prod3",
      productName: "Chemise",
    },
    {
      id: "depot4",
      name: "Dépôt A2",
      location: "Zone Industrielle, Alger",
      manager: "Ahmed Benali",
      capacity: "2000 m²",
      status: "active",
      priority: "secondaire",
      quantity: 200,
      productId: "prod1",
      productName: "T-Shirt",
    },
    {
      id: "depot5",
      name: "Dépôt B2",
      location: "Centre Ville, Oran",
      manager: "Yacine Brahimi",
      capacity: "1500 m²",
      status: "active",
      priority: "secondaire",
      quantity: 150,
      productId: "prod2",
      productName: "Jeans",
    },
    {
      id: "depot6",
      name: "Dépôt C2",
      location: "Port, Annaba",
      manager: "Riyad Mahrez",
      capacity: "1800 m²",
      status: "active",
      priority: "secondaire",
      quantity: 180,
      productId: "prod3",
      productName: "Chemise",
    },
    // Add variant-specific depots
    {
      id: "depot-var1-main",
      name: "Dépôt T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Ismail Bennacer",
      capacity: "500 m²",
      status: "active",
      priority: "principale",
      quantity: 30,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var1-sec",
      name: "Dépôt Secondaire T-Shirt Rouge S",
      location: "Zone Industrielle, Alger",
      manager: "Islam Slimani",
      capacity: "300 m²",
      status: "active",
      priority: "secondaire",
      quantity: 15,
      productId: "var1",
      productName: "T-Shirt Rouge S",
    },
    {
      id: "depot-var2-main",
      name: "Dépôt T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Aissa Mandi",
      capacity: "400 m²",
      status: "active",
      priority: "principale",
      quantity: 25,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
    {
      id: "depot-var2-sec",
      name: "Dépôt Secondaire T-Shirt Bleu M",
      location: "Centre Ville, Oran",
      manager: "Youcef Atal",
      capacity: "250 m²",
      status: "active",
      priority: "secondaire",
      quantity: 10,
      productId: "var2",
      productName: "T-Shirt Bleu M",
    },
  ]

    if (!Array.isArray(depots)) {
      return ;
    }

    const batch = db.batch();

    for (const depot of depots) {
      if (!depot.id) continue;

      const depotRef = db.collection("depots").doc(depot.id);
      batch.set(depotRef, depot, { merge: true });
    }

    await batch.commit();

  
  } catch (err) {
    console.error("Error adding depots:", err);
 
}
}
// --- Include your existing utility functions here ---
function extractWilayaFromProvince(province) {
  if (!province) return undefined;
  const match = province.match(/\d{2}/);
  return match ? match[0] : undefined;
}

function mapFinancialStatusToOrderStatus(financialStatus) {
  const statusMap = {
    'pending': 'en-attente',
    'authorized': 'confirmée',
    'partially_paid': 'en-cours',
    'paid': 'confirmée',
    'partially_refunded': 'retournée',
    'refunded': 'annulée',
    'voided': 'annulée'
  };
  return statusMap[financialStatus] || 'en-attente';
}

function formatAddress(address) {
  if (!address) return undefined;
  return [address.address1, address.address2, address.city, address.province, address.country]
    .filter(Boolean).join(', ');
}

function convertShopifyOrderToCustomFormat(shopifyOrder) {
  const rawProvince = shopifyOrder.billing_address?.city;
  const wilaya = extractWilayaFromProvince(rawProvince);
  const convertedOrder = {
    id: shopifyOrder.order_number ? shopifyOrder.order_number.toString() : "",
    date: shopifyOrder.created_at ? shopifyOrder.created_at.split('T')[0] : "",
    name: shopifyOrder.shipping_address?.name || "",
    phone: shopifyOrder.phone ? shopifyOrder.phone.replace('+213', '0') : "",
    articles: [],
    wilaya: wilaya || "",
    commune: shopifyOrder.shipping_address?.city || "",
    deliveryType: "home-delivery",
    deliveryCompany: "",
    deliveryCenter: "",
    confirmationStatus: "En attente",
    pickupPoint: "",
    status: mapFinancialStatusToOrderStatus(shopifyOrder.financial_status),
    deliveryPrice: shopifyOrder.shipping_lines?.[0]?.price ? `${shopifyOrder.shipping_lines[0].price} ${shopifyOrder.currency}` : undefined,
    address: formatAddress(shopifyOrder.shipping_address),
    additionalInfo: shopifyOrder.note || "",
    confirmatrice: "",
    totalPrice: `${shopifyOrder.total_price} ${shopifyOrder.currency}`,
    source: shopifyOrder.source_name || "Shopify",
    statusHistory: [],
  };

  if (Array.isArray(shopifyOrder.line_items)) {
    shopifyOrder.line_items.forEach(item => {
      const variantTitle = item.variant_title || "";
      const variantParts = variantTitle.split(" / ");
      convertedOrder.articles.push({
        product_id: item.product_id,
        product_name: item.title,
        variant_id: item.variant_id,
        variant_title: item.variant_title,
        variant_options: {
          option1: variantParts[0] || undefined,
          option2: variantParts[1] || undefined
        },
        quantity: item.quantity,
        unit_price: item.price,
        product_sku: item.sku || "",
        variant_sku: item.sku || ""
      });
    });
  }

  return convertedOrder;
}

// --- Main function ---
async function processTodayOrders() {
  const now = new Date();
  const todayAt3PM = new Date();
  todayAt3PM.setHours(15, 0, 0, 0);

  const ordersSnapshot = await db.collection('Orders')
    .where('processed_at', '>', todayAt3PM.toISOString())
    .get();

  if (ordersSnapshot.empty) {
    console.log('No orders found after 15:00 today.');
    return;
  }

  const batch = db.batch();

  ordersSnapshot.forEach(doc => {
    const shopifyOrder = doc.data();
    const transformedOrder = convertShopifyOrderToCustomFormat(shopifyOrder);
    const newOrderRef = db.collection('orders').doc();
    batch.set(newOrderRef, transformedOrder);
  });

  await batch.commit();
  console.log(`Processed and stored ${ordersSnapshot.size} orders.`);
}

processTodayOrders().catch(console.error);