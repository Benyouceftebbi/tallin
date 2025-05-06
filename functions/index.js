/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();


function extractWilayaFromProvince(province){
  if (!province) return undefined;

  const match = province.match(/\d{2}/); // Looks for the first two consecutive digits
  return match ? match[0] : undefined;
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
    wilaya: wilaya|| "",
    commune: shopifyOrder.shipping_address?.city || "",
    deliveryType: "home-delivery", // Default value as per shipping method
    deliveryCompany: "", // Not available in Shopify data
    deliveryCenter:"", // Not available in Shopify data
    confirmationStatus: "En attente", // Default status
    pickupPoint: "",
    status: mapFinancialStatusToOrderStatus(shopifyOrder.financial_status),
    deliveryPrice: shopifyOrder.shipping_lines && shopifyOrder.shipping_lines.length > 0 ? 
                  `${shopifyOrder.shipping_lines[0].price} ${shopifyOrder.currency}` : undefined,
    address: formatAddress(shopifyOrder.shipping_address),
    additionalInfo: shopifyOrder.note || "",
    confirmatrice: "", // Not available in Shopify data
    totalPrice: `${shopifyOrder.total_price} ${shopifyOrder.currency}`,
    source: shopifyOrder.source_name || "Shopify",
    statusHistory: [
    ]
  };

  // Process line items (articles)
  if (shopifyOrder.line_items && Array.isArray(shopifyOrder.line_items)) {
    shopifyOrder.line_items.forEach(item => {
      const variantTitle = item.variant_title || "";
      const variantParts = variantTitle.split(" / ");
      
      const article = {
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
      };
      
      convertedOrder.articles.push(article);
    });
  }

  return convertedOrder;
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
  
  const addressParts = [
    address.address1,
    address.address2,
    address.city,
    address.province,
    address.country
  ].filter(Boolean);
  
  return addressParts.join(', ');
}


function formatTimestamp(isoString) {
  if (!isoString) return undefined;
  
  const date = new Date(isoString);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}


exports.shopifyOrderCreated = onRequest( async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const orderData = req.body;
    const order=convertShopifyOrderToCustomFormat(orderData)
    logger.info("Order received", orderData);

    // Save to Firestore
    await db.collection("Orders").add(orderData);
    await db.collection("orders").add(order);

    res.status(200).send("Order stored successfully");
  } catch (error) {
    logger.error("Error storing order", error);
    res.status(500).send("Internal Server Error");
  }
});
