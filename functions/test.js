const admin = require("firebase-admin");
const { getFirestore,Timestamp } = require("firebase-admin/firestore");
const xlsx = require('xlsx');
const fs = require('fs');


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

//processTodayOrders().catch(console.error);
async function enrichVariantsWithDepotForInvoices(invoiceIds) {
  console.log("Starting depot enrichment...");

  for (const invoiceId of invoiceIds) {
    const docRef = db.collection("invoices").doc(invoiceId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.warn(`Invoice not found: ${invoiceId}`);
      continue;
    }

    const data = docSnap.data();
    const items = data.items || [];

    for (const item of items) {
      const { productId, variantId, depot, quantity } = item;

      // ✅ Only process this product ID
      if (productId !== "9895182237974") continue;

      const depotId = depot;
      console.log("Processing:", { depotId, productId, variantId });

      const variantRef = db
        .collection("Products")
        .doc(productId.toString())
        .collection("variants")
        .doc(variantId.toString());

      const variantSnap = await variantRef.get();

      if (!variantSnap.exists) {
        console.warn(`Variant not found: product ${productId}, variant ${variantId}`);
        continue;
      }

      const variantData = variantSnap.data();

      // Skip if depot info already exists
      if (Array.isArray(variantData?.depots) && variantData.depots.length > 0) {
        console.log(`Skipping variant ${variantId} (already has depots)`);
        continue;
      }

      const depotRef = db.collection("depots").doc(depotId);
      const depotSnap = await depotRef.get();

      if (!depotSnap.exists) {
        console.warn(`Depot not found: ${depotId}`);
        continue;
      }

      const depotData = depotSnap.data();

      const newDepots = [
        {
          id: depotId,
          ...depotData,
          quantity: quantity,
        },
      ];

      await variantRef.update({
        depots: newDepots,
      });

      console.log(`✅ Updated depot[0].quantity to ${quantity} for variant ${variantId} in product ${productId}`);
    }
  }

  console.log("Depot enrichment completed.");
}
// Run the function for all invoice IDs
const invoiceIds = [
  "3kdXkopTMKqnWpy0jcJg",
  "9fHZxZGaaH4NB8YhSuns",
  "a6FkdHvUNkQ8OFFagY4B",
  "hT5EK4XErRCf52UtBBLx",
];

//enrichVariantsWithDepotForInvoices(invoiceIds).catch(console.error);

/**
 * Parse Excel file to extract product information with each color-size as a separate variant
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} - Array of products with their variants
 */
function parseProductExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: 0 });

  const products = [];
  let currentProduct = null;
  let sizeColumns = {};
  const headerRow = data[0];

  for (let i = 0; i < Math.min(headerRow.length, 9); i++) {
    const header = headerRow[i];
    if (header && /^[0-9]+$/.test(header.toString())) {
      const num = parseInt(header);
      if (num >= 30 && num <= 50) {
        sizeColumns[i] = num.toString();
      }
    }
  }

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || row.slice(0, 9).every(cell => cell === 0 || cell === null || cell === '')) continue;

    if (row[0] && row[1] && !isNaN(parseFloat(row[1]))) {
      if (currentProduct) products.push(currentProduct);
      currentProduct = {
        code: row[0],
        price: parseFloat(row[1]),
        variants: []
      };
    }

    if (row[2] && currentProduct) {
      const color = row[2].toString().trim();
      Object.keys(sizeColumns).forEach(colIndex => {
        const size = sizeColumns[colIndex];
        let quantity = parseInt(row[colIndex]) || 0;

        currentProduct.variants.push({
          color,
          size,
          quantity
        });
      });
    }
  }

  if (currentProduct) products.push(currentProduct);
  return products;
}

/**
 * Syncs parsed variants to Firestore
 */
async function syncVariantsToFirestore(products) {
  const unfound = [];

  for (const product of products) {
    const productSnap = await db.collection('Products')
      .where('title', '==', product.code)
      .limit(1)
      .get();

    if (productSnap.empty) {
      console.log(`❌ Product not found: ${product.code}`);
      product.variants.forEach(v => unfound.push({ code: product.code, ...v }));
      continue;
    }

    const productDoc = productSnap.docs[0];
    const productRef = db.collection('Products').doc(productDoc.id);

    for (const variant of product.variants) {
      const variantsRef = productRef.collection('variants');
      const query = await variantsRef
        .where('option1', 'in', [variant.color, variant.size])
        .where('option2', 'in', [variant.color, variant.size])
        .get();

      let matched = false;
      query.forEach(doc => {
        const data = doc.data();
        const match1 = data.option1 === variant.color && data.option2 === variant.size;
        const match2 = data.option1 === variant.size && data.option2 === variant.color;


        if (match1 || match2) {
          matched = true;
          const updatedQty = (data.inventory_quantity || 0) + variant.inventory_quantity;
        
          variantsRef.doc(doc.id).update({
            quantity: updatedQty,
            depots: [{
  "id": "orHpkO2hxJfIBxzcBOyM",
   "name": "en linge chine",
  type:"principale",
quantity: variant.quantity,
}]
          });

          console.log(`✅ Updated: ${variant.color} / ${variant.size}`);
        }
      });

      if (!matched) {
        unfound.push({ code: product.code, ...variant });
      }
    }
  }

  if (unfound.length > 0) {
    fs.writeFileSync('unfound_variants.json', JSON.stringify(unfound, null, 2));
    console.log(`⚠️  Unfound variants saved to unfound_variants.json`);
  }
}

/**
 * Run everything
 */
async function main() {
  const filePath = 'product.xlsx';
  try {
    const products = parseProductExcel(filePath);
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
    console.log(`✅ Parsed ${products.length} products`);

    await syncVariantsToFirestore(products);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
//main().catch(console.error);
async function retryUnfoundVariantsFromFile(filePath) {
  const unfoundVariants = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const stillUnfound = [];

  for (const variant of unfoundVariants) {
    const productSnap = await db.collection('Products')
      .where('title', '==', variant.code)
      .limit(1)
      .get();


    if (productSnap.empty) {
      console.log(`❌ Product with handle not found: ${variant.code}`);
      stillUnfound.push(variant);
      continue;
    }

    const productDoc = productSnap.docs[0];
    const variantsRef = db.collection('Products').doc(productDoc.id).collection('variants');
 const query = await variantsRef
      .where('option1', 'in', [variant.color, variant.size])
      .where('option2', 'in', [variant.color, variant.size])
      .get();

    let matched = false;
    query.forEach(doc => {
     
      const data = doc.data();
      console.log(data);
      
      const match1 = data.option1 === variant.color && data.option2 === variant.size;
      const match2 = data.option1 === variant.size && data.option2 === variant.color;
console.log(data.option1,data.option2,variant.color,variant.size);

        if (match1 || match2) {
          matched = true;
          const updatedQty = (data.inventory_quantity || 0) + variant.inventory_quantity;
        
          variantsRef.doc(doc.id).update({
            quantity: updatedQty,
            depots: [{
  "id": "orHpkO2hxJfIBxzcBOyM",
   "name": "en linge chine",
  type:"principale",
quantity: variant.quantity,
}]
          });

          console.log(`✅ Updated: ${variant.color} / ${variant.size}`);
        }
    });

    if (!matched) {
      stillUnfound.push(variant);
    }
  }

  if (stillUnfound.length > 0) {
    fs.writeFileSync('unfound_variants.json', JSON.stringify(stillUnfound, null, 2));
    console.log('⚠️ Still unfound variants saved back to unfound_variants.json');
  } else {
    console.log('✅ All previously unfound variants processed successfully.');
    fs.unlinkSync('unfound_variants.json');
  }
}
async function main1() {
  try {


    if (fs.existsSync('unfound_variants.json')) {
      console.log('🔁 Retrying unfound variants based on product handle...');
      await retryUnfoundVariantsFromFile('unfound_variants.json');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
//main1().catch(console.error);
async function enrichOrderArticlesWithDepot() {
  const ordersSnapshot = await db.collection("orders").get();

  for (const orderDoc of ordersSnapshot.docs) {
    const orderRef = orderDoc.ref;
    const orderData = orderDoc.data();
    const articles = orderData.articles || [];

    const updatedArticles = await Promise.all(
      articles.map(async (article) => {
        const {
          product_id,
          variant_id,
        } = article;

        if (!product_id || !variant_id) return article;

        const variantRef = db
          .collection("Products")
          .doc(product_id.toString())
          .collection("variants")
          .doc(variant_id.toString());

        const variantSnap = await variantRef.get();

        if (!variantSnap.exists) {
          console.warn(`Variant not found for product ${product_id}, variant ${variant_id}`);
          return article;
        }

        const variantData = variantSnap.data();
        const firstDepot = Array.isArray(variantData.depots) ? variantData.depots[0] : null;

        if (!firstDepot) {
          console.warn(`No depot info found in variant ${variant_id}`);
          return article;
        }

        return {
          ...article,
          depot: {
            id: firstDepot.id || null,
            name: firstDepot.name || null,
            type: firstDepot.type || null,
            quantity: firstDepot.quantity || 0,
          },
        };
      })
    );

    // Update order with enriched articles
    await orderRef.update({ articles: updatedArticles });
    console.log(`✅ Updated order ${orderRef.id} with depot info in articles.`);
  }
}
//enrichOrderArticlesWithDepot().catch(console.error);
function generateReferenceFromDepots(depots) {
  if (!Array.isArray(depots) || depots.length === 0) return "";

  const allSameDepot = depots.every((d) => d.id === depots[0].id);
  let prefix = allSameDepot
    ? (depots[0].name || "DEPOT").substring(0, 5).toUpperCase()
    : "DEPOTD";

  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString().substring(9, 13);

  return `${prefix}-${randomStr}${timestamp}`;
}
async function addReferenceToExistingOrders() {
  const ordersSnap = await db.collection("orders").get();

  for (const doc of ordersSnap.docs) {
    const order = doc.data();

    // Skip if reference already exists
    if (order.orderReference) {
      continue;
    }

    const depots = (order.articles || [])
      .map((a) => a.depot)
      .filter((d) => d && d.id);

    if (depots.length === 0) {
      console.warn(`🚫 No valid depots for order ${doc.id}`);
      continue;
    }

    const reference = generateReferenceFromDepots(depots);

    await doc.ref.update({ orderReference:reference });
    console.log(`✅ Reference ${reference} added to order ${doc.id}`);
  }

  console.log("🎉 Finished updating references for all orders.");
}

//addReferenceToExistingOrders().catch(console.error);
async function deleteOldOrders() {
  const cutoffDate = new Date('2025-05-24T12:40:00Z'); // UTC time

  const snapshot = await db
    .collection('orders')
    .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
    .get();

  if (snapshot.empty) {
    console.log('No orders to delete before cutoff.');
    return;
  }

  const batchSize = 500;
  let batchCount = 0;
  let deletedCount = 0;

  while (!snapshot.empty) {
    const batch = db.batch();
    let counter = 0;

    for (const doc of snapshot.docs) {
      if (counter >= batchSize) break;

      batch.delete(doc.ref);
      counter++;
      deletedCount++;
    }

    await batch.commit();
    batchCount++;

    console.log(`Batch ${batchCount}: Deleted ${counter} documents`);
    break; // Remove this break if snapshot is dynamically refreshed for more than 500 docs
  }

  console.log(`Finished deleting. Total orders deleted: ${deletedCount}`);
}
//deleteOldOrders().catch(console.error);
function generateRandomReference() {
  const randomStr = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `ATELI-${randomStr}`;
}
async function updateMissingOrderReferences() {
  const snapshot = await db
    .collection("orders")
    .where("status", "==", "Confirmé")
    .where("orderReference", "==", "")
    .get();

  if (snapshot.empty) {
    console.log("No orders found with status 'Confirme' and empty orderReference.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const newRef = generateRandomReference();
    console.log(`Updating order ${doc.id} -> ${newRef}`);
    batch.update(doc.ref, { orderReference: newRef });
  });

  await batch.commit();
  console.log("✅ Order references updated successfully.");
}

updateMissingOrderReferences().catch(console.error);
